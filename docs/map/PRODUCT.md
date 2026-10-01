# Map — Product Code

Start here for any code change in ApexBoard (BizProject). Find the area, open its router or primary files, then edit only what the task needs.

| Area | What lives there | Key Files / Read Before Changing |
|---|---|---|
| [Server Backend](../../server/README.md) | Express 5 REST API, SQLite & PostgreSQL dual-adapter, auth, RBAC permissions, audit trails, sync | `server/index.js`, `server/db.js`, `server/seed.js` |
| [Client Frontend](../../client/README.md) | React 19 + Vite 8 SPA, Tailwind CSS, Lucide icons, multi-language context, role navigation | `client/src/App.jsx`, `client/src/services/api.js`, `client/src/components/` |
| [Scripts & Ops](../../scripts/README.md) | Deployment automation, live Netlify / Render syncing, PostgreSQL sync | `scripts/deploy.js`, `scripts/sync_to_neon.js` |

### Key Modules & Directories
- `client/src/components/Sidebar.jsx`: Primary navigation sidebar; handles role-based menu display (`admin` & `manager` management views vs `team` / `member` 01–07 views).
- `client/src/components/MyOverviewView.jsx`: Personal team member overview dashboard (XP progress, assigned projects, hubs, pending project state).
- `client/src/components/UploadMemberImageModal.jsx`: Modal for members to upload custom profile photos or choose stylized avatars.
- `client/src/components/AdminOverview.jsx`: Overview dashboard (Admin and Manager workspace metrics, XP highlights, activity stream).
- `client/src/components/OnboardingHub.jsx` & `client/src/components/OnboardModal.jsx`: Employee onboarding center and interactive team member wizard (prominent top XP progression bar, Step 1 name insertion with instant +5 XP reward, Step 2 checklist with task XP, Step 3 readiness graduation; Admin and Managers view candidate progress).
- `client/src/components/TeamDirectory.jsx`: Personnel directory (Admin can add/deactivate/delete members; Managers have read-only view).
- `client/src/components/MessageBoardView.jsx`: Broadcasts and direct user-to-user team communication board.
- `client/src/components/InstructionVideosView.jsx`: SOP instruction video library with audience permissions (`all` vs specific member assignments).
- `client/src/components/ProjectsDirectoryView.jsx`: Master project catalog, lifecycle stage KPIs, quick filtering, and local/live sync triggers (Admin and Manager manage projects).
- `client/src/components/MondayTable.jsx` & `client/src/components/KanbanBoard.jsx`: Interactive spreadsheets & Kanban execution workflows.
- `client/src/components/CreateTaskModal.jsx`: Modal for Admin to create tasks, select assignees, and set completion XP rewards.
- `client/src/components/LeaderboardView.jsx`: Gamified employee performance leaderboard and badges.
- `client/src/components/HelpFloatingButton.jsx`: Floating help button in the left-bottom corner triggering the interactive system guide.
- `client/src/components/HelpGuideModal.jsx`: Interactive problem solver modal with real-time search, step-by-step navigation instructions, and direct action buttons.
- `client/public/guide.html`: Comprehensive standalone guide and documentation page with problem search and bottom-left quick trigger.
- `server/index.js`: REST API endpoints, user registration default role (`role: 'team'`), video permissions, project access controls, and RBAC guards (preventing managers from adding or deleting/deactivating members).
