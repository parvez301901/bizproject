const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const { execSync } = require('child_process');

require('dotenv').config();

// Configuration
const NETLIFY_TOKEN = process.env.NETLIFY_AUTH_TOKEN;
const NETLIFY_SITE_ID = process.env.NETLIFY_SITE_ID;
const RENDER_HOOK_URL = process.env.RENDER_DEPLOY_HOOK_URL || '';

if (!NETLIFY_TOKEN || !NETLIFY_SITE_ID) {
  console.error('[Deployer] Error: NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID must be set in .env or environment.');
  process.exit(1);
}

function log(msg) {
  console.log(`[Deployer] ${msg}`);
}

// 1. Build Client
log('Building Vite React client for production...');
execSync('npm run build --prefix client', { stdio: 'inherit' });

// 2. Netlify Request Helper
function netlifyRequest(method, endpoint, headers, data) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.netlify.com',
      path: endpoint,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + NETLIFY_TOKEN,
        'User-Agent': 'BizProjectDeployer/1.0',
        ...headers
      }
    }, res => {
      let body = [];
      res.on('data', chunk => body.push(chunk));
      res.on('end', () => {
        resolve({ status: res.statusCode, data: Buffer.concat(body) });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      results.push(fullPath);
    }
  });
  return results;
}

async function deployToNetlify() {
  log('Preparing file manifest with strict POSIX forward slashes...');
  const distDir = path.resolve(__dirname, '../client/dist');
  const allFiles = walk(distDir);

  const filesMap = {};
  const fileBufferMap = {};

  allFiles.forEach(file => {
    const relPath = '/' + path.relative(distDir, file).split(path.sep).join('/');
    const buffer = fs.readFileSync(file);
    const sha1 = crypto.createHash('sha1').update(buffer).digest('hex');
    filesMap[relPath] = sha1;
    fileBufferMap[sha1] = buffer;
  });

  log(`Uploading ${Object.keys(filesMap).length} files to Netlify...`);
  const initRes = await netlifyRequest('POST', `/api/v1/sites/${NETLIFY_SITE_ID}/deploys`, {
    'Content-Type': 'application/json'
  }, JSON.stringify({ files: filesMap }));

  const deploy = JSON.parse(initRes.data.toString());
  if (deploy.required && deploy.required.length > 0) {
    for (const sha of deploy.required) {
      const buf = fileBufferMap[sha];
      await netlifyRequest('PUT', `/api/v1/deploys/${deploy.id}/files/${sha}`, {
        'Content-Type': 'application/octet-stream',
        'Content-Length': buf.length
      }, buf);
    }
  }

  log(`Netlify live: ${deploy.ssl_url || deploy.url}`);
}

// 3. Git Push
function pushToGit() {
  log('Pushing code to GitHub repository...');
  try {
    execSync('git add .', { stdio: 'inherit' });
    const status = execSync('git status --porcelain').toString();
    if (status.trim().length > 0) {
      execSync('git commit -m "Auto-deploy update"', { stdio: 'inherit' });
    }
    execSync('git push origin main', { stdio: 'inherit' });
    log('Successfully pushed to GitHub!');
  } catch (err) {
    console.error('Git push error:', err.message);
  }
}

// 4. Trigger Render Deploy Hook (if configured)
function triggerRender() {
  if (!RENDER_HOOK_URL) {
    log('Tip: You can add RENDER_DEPLOY_HOOK_URL in .env to auto-trigger Render builds via webhook.');
    return;
  }
  log('Triggering Render deployment hook...');
  https.get(RENDER_HOOK_URL, res => {
    log(`Render hook triggered! Status: ${res.statusCode}`);
  }).on('error', e => console.error('Render trigger failed:', e.message));
}

async function main() {
  try {
    pushToGit();
    await deployToNetlify();
    triggerRender();
    log('=== DEPLOYMENT COMPLETE ===');
    log('Frontend: https://bizproject-80307.netlify.app');
    log('Backend:  https://bizproject-api.onrender.com');
  } catch (e) {
    console.error('Deployment error:', e);
    process.exit(1);
  }
}

main();
