# Production Readiness & Hardening Playbook

A step-by-step operational guide for converting a full-stack Node.js / React application (or similar architecture) from an MVP / prototype into a secure, scalable, and compliant production-grade system.

---

## Table of Contents
1. [Phase 1: Security Hardening](#phase-1-security-hardening)
2. [Phase 2: Environment & Configuration Management](#phase-2-environment--configuration-management)
3. [Phase 3: Database & Data Integrity](#phase-3-database--data-integrity)
4. [Phase 4: Automated Testing & CI/CD](#phase-4-automated-testing--cicd)
5. [Phase 5: Media, Uploads & Asset Handling](#phase-5-media-uploads--asset-handling)
6. [Phase 6: Logging, Monitoring & Observability](#phase-6-logging-monitoring--observability)
7. [Phase 7: Deployment, Containerization & Reverse Proxy](#phase-7-deployment-containerization--reverse-proxy)
8. [Production Launch Verification Checklist](#production-launch-verification-checklist)

---

## Phase 1: Security Hardening

### 1.1 Route-Level Authentication & Authorization Middleware
- **Never expose raw endpoints**: Ensure all CRUD endpoints require a verified JWT bearer token.
- **Implement role-based access control (RBAC)**: Check permissions on user roles (`admin`, `teacher`, `student`, etc.).

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or malformed token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
```

### 1.2 Restrict CORS to Allowed Domains
Do not leave `app.use(cors())` wide open. Specify the exact origins:

```javascript
const cors = require('cors');

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://yourdomain.com').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation: Origin not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 1.3 Add HTTP Security Headers with Helmet
Install `helmet` to set secure response headers:
```bash
npm install helmet
```
```javascript
const helmet = require('helmet');
app.use(helmet());
```

### 1.4 Rate Limiting & Brute-Force Prevention
Protect sensitive routes (login, registration, forgot-password, payment endpoints):
```bash
npm install express-rate-limit
```
```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts per IP
  message: { error: 'Too many authentication attempts, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
```

### 1.5 Input Sanitization & Parameter Validation
Use validation libraries such as `zod`, `joi`, or `express-validator` to reject malicious payloads and invalid inputs prior to database queries.

---

## Phase 2: Environment & Configuration Management

### 2.1 Never Fall Back to Insecure Defaults
In production, do not fall back to hardcoded strings like `'secret123'`. Throw a startup error if required keys are missing:

```javascript
const requiredEnv = ['JWT_SECRET', 'DATABASE_URL', 'NODE_ENV'];

for (const envKey of requiredEnv) {
  if (!process.env[envKey]) {
    console.error(`[FATAL] Missing required environment variable: ${envKey}`);
    process.exit(1);
  }
}
```

### 2.2 Template Configuration File (`.env.example`)
Maintain an `.env.example` in source control (never commit `.env`):
```env
# Server
PORT=5000
NODE_ENV=production
ALLOWED_ORIGINS=https://app.yourdomain.com

# Security
JWT_SECRET=generate_strong_64_byte_random_hex_string
JWT_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/school_db
```

---

## Phase 3: Database & Data Integrity

### 3.1 Separate Demo Seeding from Production
Ensure demo seed routines (which inject dummy users like `admin123`) run **only** in development/test environments:

```javascript
// seed.js
async function runSeed() {
  if (process.env.NODE_ENV === 'production' && !process.env.FORCE_SEED) {
    console.log('[Seed] Skipped automatic demo seeding in production environment.');
    return;
  }
  // Proceed with development seed...
}
```

### 3.2 Formal Schema Migrations
Move away from raw table initialization on startup (`initDB()`) to structured migrations (e.g., using `knex`, `prisma`, or `db-migrate`). This ensures schema changes are tracked and rollback-capable.

### 3.3 Database Connection Pooling & Automated Backups
- Configure connection pools (`max: 20`, `idleTimeoutMillis: 30000`).
- Setup automated daily backups (e.g., automated `pg_dump` with S3 storage or managed cloud DB automated snapshots with point-in-time recovery).

---

## Phase 4: Automated Testing & CI/CD

### 4.1 Backend Integration Testing (Supertest + Jest/Vitest)
```bash
npm install -D vitest supertest
```
Create tests verifying critical endpoints:
- Successful authentication & token generation
- Unauthorized access rejection on protected endpoints
- Valid CRUD operations and validation failure handling

### 4.2 Frontend Component & Smoke Testing
- Verify all primary views mount without throwing uncaught exceptions.
- Add end-to-end (E2E) flows for login, dashboard loading, and key actions using Playwright or Cypress.

### 4.3 Automated GitHub Actions CI Pipeline
```yaml
# .github/workflows/ci.yml
name: CI Build & Test

on: [push, pull_request]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build:client
      - run: npm test --if-present
```

---

## Phase 5: Media, Uploads & Asset Handling

1. **Avoid Storing Base64 Blobs in Relational DBs**: Storing multi-megabyte base64 strings in PostgreSQL or SQLite degrades table performance.
2. **Dedicated Cloud Storage**: Use S3, Cloudflare R2, or Google Cloud Storage with presigned upload URLs.
3. **Image Optimization & Size Limits**: Compress and resize images on upload to standard dimensions (e.g., max 500x500 for ID card avatars).

---

## Phase 6: Logging, Monitoring & Observability

### 6.1 Structured Logging (Winston / Pino)
Replace arbitrary `console.log` statements with structured JSON logs containing timestamps, request IDs, and log levels:
```javascript
const pino = require('pino');
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
```

### 6.2 Application Performance & Error Tracking (Sentry)
Catch unhandled promise rejections and exceptions:
```bash
npm install @sentry/node
```

### 6.3 Health Check Endpoint
Provide an unauthenticated liveness and readiness probe for load balancers:
```javascript
app.get('/health', async (req, res) => {
  try {
    // Check DB connection
    await query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', error: err.message });
  }
});
```

---

## Phase 7: Deployment, Containerization & Reverse Proxy

### 7.1 Dockerfile
```dockerfile
# Multi-stage Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY client/package*.json ./client/
RUN npm ci
RUN npm run build:client

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/client/dist ./client/dist
COPY server/ ./server/

EXPOSE 5000
CMD ["node", "server/index.js"]
```

### 7.2 Reverse Proxy Configuration (Nginx)
Always terminate SSL/TLS at the reverse proxy (or load balancer):
- Force HTTPS redirection (HTTP -> HTTPS).
- Set `client_max_body_size 25M`.
- Enable Gzip / Brotli compression.
- Serve `/dist` client static assets directly via Nginx, proxy `/api/*` requests to the Node.js backend.

### 7.3 Process Management (PM2)
If running directly on a VM without Docker:
```bash
npm install -g pm2
pm2 start server/index.js --name "school-api" -i max
pm2 save
pm2 startup
```

---

## Production Launch Verification Checklist

- [ ] All critical API routes have `requireAuth` and role verification.
- [ ] No default or dummy passwords/secrets in production code or config.
- [ ] CORS is restricted to valid domains.
- [ ] Rate limiting is active on authentication endpoints.
- [ ] Automatic demo database seeding is disabled in production.
- [ ] Production build (`npm run build:client`) runs without warnings/errors.
- [ ] Health check endpoint (`/health`) returns `200 OK`.
- [ ] Automated database backup schedule is established and tested.
- [ ] SSL/TLS certificates configured (A+ rating on SSL Labs).
- [ ] Error tracking service (e.g., Sentry) is integrated.
