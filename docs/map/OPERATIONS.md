# Map — Operations & Deployment

| Task | What the row says | Reference Guide / Command |
|---|---|---|
| **Local Setup** | Run backend on port 5001, frontend on port 3001 | `start-3001.bat` or `npm run server` + `npm run client` |
| **Pre-PR / Build Check** | Vite build test for syntax, JSX, and minification | `npm run build:client` |
| **Production Deploy** | Full automated push to GitHub, Render reload, and Netlify publish | `npm run deploy` (via `scripts/deploy.js`) |
| **Database Sync (Local to Live)** | Replicate local SQLite projects & tasks to Neon PostgreSQL | `node scripts/sync_to_neon.js` |
| **Live Verification** | Public URLs for production verification | Frontend: https://bizproject-80307.netlify.app<br>Backend: https://bizproject-api.onrender.com/api/health |
| **Configuration & Env** | Port configs, JWT secret, DB connection strings | `.env.example`, `.env`, `client/.env.production` |
