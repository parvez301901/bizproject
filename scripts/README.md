# Scripts & Operations Router

| Folder or file | What lives there | Read before changing |
|---|---|---|
| `scripts/deploy.js` | Automated end-to-end deployment script (git add/commit/push, Netlify build & upload, live health check) | Read before changing deployment targets, credentials handling, or build scripts |
| `scripts/sync_to_neon.js` | Replicates local SQLite tables, users, projects, and tasks to cloud Neon PostgreSQL | Read before running manual database cloud migrations |
| `start-3001.bat` | One-click Windows runner to start both backend (port 5001) and frontend (port 3001) | Read for local dual-server bootstrap on Windows |

## Operations Runbook
- Automated Deploy: `npm run deploy`
- Database Cloud Replication: `node scripts/sync_to_neon.js`
