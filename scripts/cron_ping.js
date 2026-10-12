const https = require('https');

const PING_URL = process.env.PING_URL || 'https://bizproject-api.onrender.com/api/health';

function isWithinBangladeshWorkingHours() {
  // Convert current UTC time to Bangladesh Standard Time (UTC+6)
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();

  const bstTotalMinutes = (utcHours * 60 + utcMinutes + 6 * 60) % (24 * 60);
  const bstHour = Math.floor(bstTotalMinutes / 60);

  // 8:00 AM (8:00) to 5:00 PM (17:00)
  return bstHour >= 8 && bstHour < 17;
}

function ping(url) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const req = https.get(url, { timeout: 45000 }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          elapsedMs: Date.now() - start,
          body
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out after 45s (server waking up)'));
    });

    req.on('error', reject);
  });
}

async function run() {
  const force = process.argv.includes('--force');
  const nowStr = new Date().toISOString();

  if (!force && !isWithinBangladeshWorkingHours()) {
    console.log(`[Ping] ${nowStr} Outside Bangladesh working hours (08:00 - 17:00 BST). Skipping ping.`);
    return;
  }

  console.log(`[Ping] ${nowStr} Active working window (BST). Pinging ${PING_URL}...`);
  try {
    const res = await ping(PING_URL);
    console.log(`[Ping] Success! Status: ${res.statusCode}, Time: ${res.elapsedMs}ms`);
  } catch (err) {
    console.warn(`[Ping] Initial attempt noticed delay/error: ${err.message}. Retrying once to wake server...`);
    try {
      const retryRes = await ping(PING_URL);
      console.log(`[Ping] Server awake! Status: ${retryRes.statusCode}, Time: ${retryRes.elapsedMs}ms`);
    } catch (retryErr) {
      console.error(`[Ping] Retry failed: ${retryErr.message}`);
    }
  }
}

run();
