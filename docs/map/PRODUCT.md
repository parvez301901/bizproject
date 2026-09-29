# Map — Product Code

Start here for any code change in ApexBoard (BizProject). Find the area, open its router or primary files, then edit only what the task needs.

| Area | What lives there | Key Files / Read Before Changing |
|---|---|---|
| [Server Backend](../../server/README.md) | Express 5 REST API, SQLite & PostgreSQL dual-adapter, auth, audit trails, sync | `server/index.js`, `server/db.js`, `server/seed.js` |
| [Client Frontend](../../client/README.md) | React 19 + Vite 8 SPA, Tailwind CSS, Lucide icons, multi-language context | `client/src/App.jsx`, `client/src/services/api.js`, `client/src/components/` |
| [Scripts & Ops](../../scripts/README.md) | Deployment automation, live Netlify / Render syncing, PostgreSQL sync | `scripts/deploy.js`, `scripts/sync_to_neon.js` |

### Key Modules & Directories
- `client/src/components/ProjectsDirectoryView.jsx`: Master project catalog, lifecycle stage KPIs, quick filtering, and local/live sync triggers.
- `client/src/components/ProjectSyncModal.jsx`: Interactive modal for push/pull synchronization between localhost and live Render/Neon.
- `client/src/components/MondayTable.jsx` & `client/src/components/KanbanBoard.jsx`: Interactive spreadsheets & Kanban execution workflows.
- `client/src/components/OnboardModal.jsx`: 4-step interactive employee onboarding wizard with XP initialization.
