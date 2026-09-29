# Enterprise Project & Task Management Platform (ApexBoard)

A Monday.com and ClickUp style work operating system tailored for high-volume data handling, multi-project execution, and employee onboarding. Built with a modern, elegant **Light Greenish (Mint & Emerald)** enterprise aesthetic.

---

## 🚀 Key Features

### 1. Monday.com & ClickUp Style Task Management
- **Interactive Spreadsheet/Grid View**: Inline editable cells for task names, status dropdowns, priority tags, assignees, due dates, and estimated hours with instant persistence.
- **Dynamic Kanban Board**: Drag-and-drop workflow cards across custom statuses (`Backlog`, `To Do`, `In Progress`, `In Review`, `Done`).
- **High-Volume Bulk Actions**: Multi-select rows to execute bulk status changes, bulk reassignment, or batch archiving.
- **Detailed Task Drawer**: Real-time team discussion comments, descriptions, metadata, and audit logs.

### 2. Employee Onboarding & Lifecycle Hub
- **New Hire Onboarding Stepper**: Provision new employees with department, title, permissions, contact details, and skill tags.
- **Automated Checklists**: Dynamic generation of milestone tasks across HR, IT Security (2FA, SSO), Legal/NDA, Tooling setup, and Mentorship.
- **Live Progress Tracking**: Instant recalculation of onboarding completion percentages.
- **Team Directory**: Filterable roster across departments (Engineering, Product Design, Operations & Strategy, Marketing, etc.).

### 3. Executive Operations Control (Admin Board)
- **KPI Metrics**: Real-time task count, completion velocity, team capacity, and active onboarding numbers.
- **Workflow & Risk Breakdown**: Visual distribution bars for status distribution and priority risk allocations.
- **Light Greenish Enterprise Palette**: Mint accents (`#34d399`), deep emeralds (`#10b981`, `#059669`), subtle sage surfaces (`#f8fafc`, `#ecfdf5`), and crisp borders. Zero harsh cyan or electric teal colors.

---

## 🛠 Tech Stack & Architecture

- **Frontend**: React 19, Vite 8, Tailwind CSS v4, Lucide Icons, DnD drag-and-drop.
- **Backend**: Node.js, Express, REST APIs, JSON data serialization.
- **Database Engine**: 
  - Dual PostgreSQL / high-throughput SQLite engine.
  - Automatically connects to PostgreSQL 17 (or runs on zero-config local WAL database).

---

## 🏃‍♂️ How to Run

### Backend API Server:
```bash
npm run server
# Running at http://localhost:5000
```

### Frontend Client:
```bash
npm run client
# Open in browser: http://localhost:3000
```
