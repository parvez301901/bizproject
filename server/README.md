# Server Backend Router & Reference

| Folder or file | What lives there | Read before changing |
|---|---|---|
| `server/index.js` | Express 5 server initialization, REST API endpoints, JWT auth middleware, RBAC guards, file uploads | Read when adding API endpoints, altering permission logic, or modifying socket/file handling |
| `server/db.js` | Dual SQLite/PostgreSQL database abstraction layer, query builder, dynamic connection pooling | Read before altering SQL queries, schema tables, or DB adapter behaviors |
| `server/seed.js` | Initial database seeding script (default admin, manager, member credentials, sample projects and tasks) | Read when adding mock data, initial admin accounts, or sample metrics |
| `server/uploads/` | Uploaded assets (profile avatars, project files, attachments) | Stored media directory |

## Quick Commands
- Start backend: `npm run server` or `node server/index.js` (runs on `http://localhost:5001`)
- Seed database: `node server/seed.js`
