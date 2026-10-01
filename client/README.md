# Client Frontend Router & Reference

| Folder or file | What lives there | Read before changing |
|---|---|---|
| `client/src/App.jsx` | Top-level state coordinator, authentication state, modal state, active tab routing | Read before modifying app navigation or global modals |
| `client/src/components/Sidebar.jsx` | Main responsive navigation drawer, role-based menu display, custom language uploader | Read before adding new navigation links or modifying role menu access |
| `client/src/components/` | Modular UI views (AdminOverview, MyOverviewView, OnboardingHub, ProjectsDirectoryView, MondayTable, KanbanBoard, LeaderboardView, MessageBoardView, InstructionVideosView, WorkReportView, etc.) | Read specific component before modifying view-specific UI |
| `client/src/services/api.js` | Axios API service layer with authentication token interceptor and API methods | Read before integrating new backend endpoints |
| `client/src/LanguageContext.jsx` | Multi-language internationalization context (`en`, `sv`, custom JSON) | Read before adding localization strings |
| `client/src/locales/` | Translation dictionaries (`en.json`, `sv.json`) | Read before modifying translation keys |
| `client/public/guide.html` | Self-contained, interactive Member & Admin How-To Guide with instant search, role switcher, and quick copy | Read before updating user guide or documentation |

## Quick Commands
- Start dev frontend: `npm run client` (runs on `http://localhost:3001`)
- Production build: `npm run build:client`
