import React, { useState } from 'react';
import { Code, ChevronDown, ChevronUp, Copy, Check, ExternalLink } from 'lucide-react';

const PAGE_DETAILS = {
  dashboard: {
    title: 'Admin Dashboard',
    file: 'src/components/AdminOverview.jsx',
    fullPath: 'client/src/components/AdminOverview.jsx',
    purpose: 'Executive overview displaying system metrics, recent activity feed, quick onboarding stats, and high-level team summary cards.'
  },
  overview: {
    title: 'My Overview',
    file: 'src/components/MyOverviewView.jsx',
    fullPath: 'client/src/components/MyOverviewView.jsx',
    purpose: 'Personal workspace portal for members/admins: assigned tasks, urgent notice alerts, personal XP stats, and quick links.'
  },
  project: {
    title: 'Project Board (Execution)',
    file: 'src/components/MondayTable.jsx / KanbanBoard.jsx',
    fullPath: 'client/src/components/MondayTable.jsx (or KanbanBoard.jsx)',
    purpose: 'Interactive task execution board with inline editing, Monday.com style table view, Kanban drag/drop, priorities, and deadlines.'
  },
  projects_directory: {
    title: 'Projects Directory',
    file: 'src/components/ProjectsDirectoryView.jsx',
    fullPath: 'client/src/components/ProjectsDirectoryView.jsx',
    purpose: 'Central catalog of company projects featuring lifecycle stage badges, completion progress bars, docs viewer, and direct links.'
  },
  leaderboard: {
    title: 'Leaderboard & XP Ranking',
    file: 'src/components/LeaderboardView.jsx',
    fullPath: 'client/src/components/LeaderboardView.jsx',
    purpose: 'Gamified ranking board tracking member XP, levels, achievement badges, and activity milestones.'
  },
  onboarding: {
    title: 'Onboarding Hub',
    file: 'src/components/OnboardingHub.jsx',
    fullPath: 'client/src/components/OnboardingHub.jsx',
    purpose: 'New hire checklist manager, onboarding progress tracking, step verification, and training pipeline.'
  },
  team: {
    title: 'Team Directory',
    file: 'src/components/TeamDirectory.jsx',
    fullPath: 'client/src/components/TeamDirectory.jsx',
    purpose: 'Directory of all active members, roles, contact info, expertise tags, and quick profile actions.'
  },
  messages: {
    title: 'Message Board',
    file: 'src/components/MessageBoardView.jsx',
    fullPath: 'client/src/components/MessageBoardView.jsx',
    purpose: 'Internal communication hub for company-wide notices, team discussions, pinned directives, and announcements.'
  },
  videos: {
    title: 'Instruction Videos',
    file: 'src/components/InstructionVideosView.jsx',
    fullPath: 'client/src/components/InstructionVideosView.jsx',
    purpose: 'Knowledge base of embedded training videos, step-by-step developer tutorials, and operational guides.'
  },
  reports: {
    title: 'Work Reports & Timesheets',
    file: 'src/components/WorkReportView.jsx',
    fullPath: 'client/src/components/WorkReportView.jsx',
    purpose: 'Time tracking analysis, timesheet logs, member work contributions, and project billable hours.'
  },
  deactivated: {
    title: 'Deactivated Members',
    file: 'src/components/DeactivatedMembers.jsx',
    fullPath: 'client/src/components/DeactivatedMembers.jsx',
    purpose: 'Archived staff directory with one-click reactivate or permanent removal options.'
  },
  logs: {
    title: 'Audit Logs',
    file: 'src/components/AuditLogView.jsx',
    fullPath: 'client/src/components/AuditLogView.jsx',
    purpose: 'Immutable security & operational audit trail recording every task edit, creation, deletion, and system action.'
  }
};

export default function DevPageIndicator({ activeTab, projectViewMode, className = '' }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const info = PAGE_DETAILS[activeTab] || {
    title: activeTab,
    file: `Active Tab: ${activeTab}`,
    fullPath: `client/src/App.jsx (activeTab: ${activeTab})`,
    purpose: 'Dynamic view inside App.jsx'
  };

  // Fine-tune file for project tab according to view mode
  const currentFile = activeTab === 'project'
    ? (projectViewMode === 'kanban' ? 'src/components/KanbanBoard.jsx' : 'src/components/MondayTable.jsx')
    : info.file;

  const currentFullPath = activeTab === 'project'
    ? (projectViewMode === 'kanban' ? 'client/src/components/KanbanBoard.jsx' : 'client/src/components/MondayTable.jsx')
    : info.fullPath;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(currentFullPath);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className={`select-none font-sans ${className}`}>
      <div 
        onClick={() => setExpanded(!expanded)}
        className="bg-slate-900/95 hover:bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md transition-all duration-200 cursor-pointer overflow-hidden max-w-sm sm:max-w-md w-full"
        style={{ minWidth: '260px' }}
      >
        {/* Compact Bar (always visible) */}
        <div className="px-3.5 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="truncate">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mr-1.5 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60">
                DEV
              </span>
              <span className="text-xs font-semibold text-slate-200 font-mono truncate">
                {currentFile}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 text-slate-400">
            <button
              type="button"
              onClick={handleCopy}
              title="Copy file path"
              className="p-1 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button 
              type="button"
              className="p-1 hover:text-white"
              aria-label={expanded ? 'Collapse detail' : 'Expand detail'}
            >
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Expanded Panel (shows task detail & file path) */}
        {expanded && (
          <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-800 text-xs space-y-2 bg-slate-950/60">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Page / View:
              </div>
              <div className="text-slate-100 font-semibold flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-emerald-400" />
                <span>{info.title}</span>
                {activeTab === 'project' && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono uppercase">
                    {projectViewMode}
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                File Location:
              </div>
              <div className="bg-slate-900 px-2 py-1.5 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-300 break-all flex items-center justify-between gap-2">
                <span>{currentFullPath}</span>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Task Detail / Purpose:
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {info.purpose}
              </p>
            </div>
            
            <div className="pt-1 text-[10px] text-slate-400 text-right italic">
              Click header or chevron to minimize
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
