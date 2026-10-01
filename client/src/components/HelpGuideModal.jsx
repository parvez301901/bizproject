import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  Search,
  X,
  ArrowRight,
  CheckCircle2,
  Clock,
  ListTodo,
  FolderKanban,
  Video,
  Trophy,
  Users,
  Megaphone,
  Globe,
  ShieldCheck,
  FileText,
  Sparkles,
  Copy,
  Check,
  ChevronRight,
  BookOpen,
  Layers,
  Lightbulb,
  Compass,
  Kanban,
  Table,
  UserPlus,
  Plus,
  Play,
  Calendar,
  AlertCircle
} from 'lucide-react';

export const SYSTEM_GUIDES = [
  {
    id: 'find_my_tasks',
    title: 'Find My Assigned Tasks',
    category: 'tasks',
    icon: ListTodo,
    color: 'emerald',
    badge: 'Popular',
    summary: 'Quickly locate all tasks assigned to you across projects with their deadlines and status.',
    breadcrumb: 'Sidebar → My Overview (or Project Board)',
    roles: 'All Users',
    steps: [
      'Click "My Overview" in the sidebar navigation (available for all team members).',
      'Under the "My Active Tasks" section, see all tasks directly assigned to your account.',
      'Alternatively, click "Projects" in the sidebar and select any active project.',
      'Use the search bar or filter buttons at the top of the project table to filter by your name, priority, or status.'
    ],
    actionLabel: 'Go to My Overview',
    actionTab: 'overview',
    tips: 'Tasks display priority color badges (Red = High, Amber = Medium, Sky = Low) and live deadlines.'
  },
  {
    id: 'create_new_task',
    title: 'Create a New Task',
    category: 'tasks',
    icon: Plus,
    color: 'emerald',
    badge: 'Core',
    summary: 'Add a new task to any project board with deadlines, priority, and assignees.',
    breadcrumb: 'Project Board → Top Right "+ New Task" Button',
    roles: 'Admin, Manager, & Assigned Members',
    steps: [
      'Navigate to the project board where you want to add the task.',
      'Click the green "+ New Task" button in the top right header.',
      'Fill in the Task Title, Description, Priority (High, Medium, Low), and Estimated Hours.',
      'Assign the task to one or more team members from the dropdown.',
      'Select a Due Date and click "Create Task". It will appear immediately in both Table and Kanban views.'
    ],
    actionLabel: 'Open New Task Modal',
    actionModal: 'createTask',
    actionTab: 'project',
    tips: 'Assigning a task will notify the team member and track work hours against their quota.'
  },
  {
    id: 'log_work_hours',
    title: 'Log Work Hours & Timesheets',
    category: 'time',
    icon: Clock,
    color: 'amber',
    badge: 'XP Boost',
    summary: 'Track your daily hours worked on tasks, maintain accurate company records, and earn XP.',
    breadcrumb: 'Header Clock Icon (or Sidebar → Work Reports → "+ Log Time")',
    roles: 'All Members',
    steps: [
      'Click the "Log" (Clock icon) button in the top navigation bar, or open "Work Reports" from the sidebar.',
      'In the Log Work Time modal, select your active Project and the specific Task you worked on.',
      'Enter the number of hours worked (e.g. 2.5) and the work date.',
      'Provide a clear description of the work completed or milestones reached.',
      'Click "Submit Log". Your hours will be added to the company timesheet and award you XP points!'
    ],
    actionLabel: 'Open Log Work Modal',
    actionModal: 'logWork',
    actionTab: 'reports',
    tips: 'Every hour of logged work awards +25 XP toward your rank on the company Leaderboard!'
  },
  {
    id: 'instruction_videos',
    title: 'Watch Training & Instruction Videos (SOPs)',
    category: 'training',
    icon: Video,
    color: 'sky',
    badge: 'Knowledge',
    summary: 'Access video walkthroughs, Standard Operating Procedures (SOPs), and dev tutorials.',
    breadcrumb: 'Sidebar → Instruction Videos (SOP)',
    roles: 'All Members (Custom audience available)',
    steps: [
      'Click "Instruction Videos" in the left sidebar navigation.',
      'Browse through SOP categories: Training & SOP, Developer Guides, Design Systems, or Security.',
      'Use the search bar to find videos by title, topic, or keyword.',
      'Click "Watch Video" to play inside the high-clarity video player modal with full descriptions.',
      'Admins can upload local MP4 video files or paste YouTube / Vimeo links.'
    ],
    actionLabel: 'Go to Instruction Videos',
    actionTab: 'videos',
    tips: 'Videos tagged as "Open to All" are accessible to all team members, while restricted videos are private to assigned personnel.'
  },
  {
    id: 'leaderboard_xp',
    title: 'XP Points, Levels & Leaderboard',
    category: 'training',
    icon: Trophy,
    color: 'amber',
    badge: 'Gamified',
    summary: 'Understand how XP leveling works and check your team standing on the leaderboard.',
    breadcrumb: 'Sidebar → Leaderboard (XP 🏆)',
    roles: 'All Members',
    steps: [
      'Click "Leaderboard" in the sidebar navigation.',
      'Inspect the Top 3 Podium winners and global roster rankings.',
      'XP is automatically awarded for:',
      '• Completing tasks: +50 to +100 XP depending on priority',
      '• Logging work hours: +25 XP per logged hour',
      '• Finishing Onboarding steps: +35 XP per verified checklist task',
      'Accumulating XP levels up your profile badge (Lvl 1 to Lvl 50+) visible in team directories.'
    ],
    actionLabel: 'Go to Leaderboard',
    actionTab: 'leaderboard',
    tips: 'Level thresholds scale progressively. Check the leaderboard weekly for top contributor awards!'
  },
  {
    id: 'onboard_new_member',
    title: 'Onboard a New Team Member',
    category: 'team',
    icon: UserPlus,
    color: 'emerald',
    badge: 'Admin',
    summary: 'Add a new employee or contractor to the team and assign onboarding pipelines.',
    breadcrumb: 'Sidebar → Onboarding Hub → "+ Onboard New Member"',
    roles: 'Admin & Manager',
    steps: [
      'Click "Onboarding Hub" in the sidebar.',
      'Click the "+ Onboard New Member" button at the top of the hub.',
      'Enter the candidate’s Full Name, Corporate Email, Department, Job Title, and Phone.',
      'Set an initial password and assign their role (Admin, Manager, Team Member).',
      'The new member will automatically receive the onboarding master checklist upon their first login!'
    ],
    actionLabel: 'Go to Onboarding Hub',
    actionModal: 'onboard',
    actionTab: 'onboarding',
    tips: 'Admins can customize the Common Onboarding Template from the "Common Template" tab in the hub.'
  },
  {
    id: 'projects_and_views',
    title: 'Switch Kanban & Monday-Style Table Views',
    category: 'projects',
    icon: Kanban,
    color: 'indigo',
    badge: 'Workflow',
    summary: 'Toggle between Monday.com style table grid and drag-and-drop Kanban columns.',
    breadcrumb: 'Project Board Header → Switcher Pills',
    roles: 'All Members',
    steps: [
      'Open any project board from the sidebar or Projects Directory.',
      'At the top right of the project header, look for the view switcher pills.',
      'Click "Main Table" for row-by-row inline editing, deadline dates, and group metrics.',
      'Click "Kanban" for visual stage cards organized by To Do, In Progress, Review, and Done.',
      'In Kanban view, drag and drop cards across columns to update task status in real-time!'
    ],
    actionLabel: 'Go to Projects',
    actionTab: 'projects_directory',
    tips: 'In Table view, click on any priority or status pill to change it instantly without opening a modal.'
  },
  {
    id: 'message_board_notices',
    title: 'Company Directives & Message Board',
    category: 'team',
    icon: Megaphone,
    color: 'rose',
    badge: 'HQ Comms',
    summary: 'Stay updated with executive notices, sprint deadlines, and company-wide directives.',
    breadcrumb: 'Sidebar → Message Board (HQ)',
    roles: 'All Members (Admin to Post Pinned Notices)',
    steps: [
      'Click "Message Board" in the sidebar navigation.',
      'Review high-priority pinned notices highlighted with urgent badges.',
      'Click on any announcement to read the full brief, comment, or ask questions.',
      'Click the "Notice" bell in the top navigation anytime you see a red unread badge.'
    ],
    actionLabel: 'Go to Message Board',
    actionTab: 'messages',
    tips: 'Important company notices are highlighted with immediate modal alerts upon entering the workspace.'
  },
  {
    id: 'change_language_pack',
    title: 'Change Language / Upload Translation Pack',
    category: 'settings',
    icon: Globe,
    color: 'teal',
    badge: 'i18n',
    summary: 'Switch interface language between English, Swedish, etc., or upload custom JSON.',
    breadcrumb: 'Sidebar Footer → Language Selector',
    roles: 'All Users (Custom upload: Admin/Manager)',
    steps: [
      'Scroll to the bottom of the left sidebar.',
      'Click the Language dropdown selector.',
      'Select your preferred language (e.g. English, Swedish / Svenska).',
      'The entire user interface, buttons, and navigation terms will translate immediately.',
      'Admins & Managers can click "Upload Custom JSON" to load any new localized language pack!'
    ],
    actionLabel: 'View Sidebar Footer',
    actionTab: 'overview',
    tips: 'Uploaded language packs are cached in your local browser session for instant reload.'
  },
  {
    id: 'audit_logs_security',
    title: 'Security & Audit Logs',
    category: 'settings',
    icon: ShieldCheck,
    color: 'slate',
    badge: 'Audit Trail',
    summary: 'Inspect the tamper-proof chronological log of all task edits, deletions, and logins.',
    breadcrumb: 'Sidebar → Management → Audit Logs',
    roles: 'Admin & Manager',
    steps: [
      'In the sidebar, scroll down to the "Management" section.',
      'Click "Audit Logs" to view the security stream.',
      'Every task creation, deletion, status shift, and work log is recorded with actor name and timestamp.',
      'Filter logs by action type (CREATE, UPDATE, DELETE) or search for specific actor usernames.'
    ],
    actionLabel: 'Go to Audit Logs',
    actionTab: 'logs',
    tips: 'Audit records are immutable and stored in the central database for compliance and auditing.'
  },
  {
    id: 'project_specs_docs',
    title: 'Project Architecture & Specs Viewer',
    category: 'projects',
    icon: BookOpen,
    color: 'emerald',
    badge: 'Docs',
    summary: 'Read Markdown technical specifications, architecture blueprints, and export PDFs.',
    breadcrumb: 'Project Board Header → "Overview & Specs" Button',
    roles: 'All Members',
    steps: [
      'Navigate to any project board.',
      'In the header bar, click the "Overview & Specs" button with the book icon.',
      'Read the rendered Markdown documentation, technical requirements, and target milestones.',
      'Click "Export PDF" or "Print" to generate a client-ready documentation sheet.'
    ],
    actionLabel: 'Go to Projects',
    actionTab: 'projects_directory',
    tips: 'Admins can edit the markdown content anytime using the "Edit Project" button.'
  },
  {
    id: 'work_reports_timesheets',
    title: 'Team Work Reports & Productivity Analytics',
    category: 'time',
    icon: FileText,
    color: 'blue',
    badge: 'Analytics',
    summary: 'View aggregated hours worked, billable project splits, and team productivity charts.',
    breadcrumb: 'Sidebar → Reports (Live)',
    roles: 'All Members (Full team view: Admin/Manager)',
    steps: [
      'Click "Reports" in the sidebar navigation.',
      'View total hours logged across all projects and daily breakdown charts.',
      'Filter by project, member, or date range (This Week, This Month, All Time).',
      'Export timesheet reports or inspect individual contributions.'
    ],
    actionLabel: 'Go to Reports',
    actionTab: 'reports',
    tips: 'Make sure your team members log work daily to maintain accurate sprint burndown statistics.'
  }
];

export default function HelpGuideModal({
  isOpen,
  onClose,
  onNavigate,
  onOpenModal,
  currentUser
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeGuideId, setActiveGuideId] = useState(SYSTEM_GUIDES[0].id);
  const [copiedSteps, setCopiedSteps] = useState(false);

  // Filter guides based on query and category
  const filteredGuides = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return SYSTEM_GUIDES.filter((guide) => {
      const matchesCategory =
        selectedCategory === 'all' || guide.category === selectedCategory;

      if (!q) return matchesCategory;

      const titleMatch = guide.title.toLowerCase().includes(q);
      const summaryMatch = guide.summary.toLowerCase().includes(q);
      const breadcrumbMatch = guide.breadcrumb.toLowerCase().includes(q);
      const stepsMatch = guide.steps.some((s) => s.toLowerCase().includes(q));
      const tipsMatch = guide.tips?.toLowerCase().includes(q);

      return (
        matchesCategory &&
        (titleMatch || summaryMatch || breadcrumbMatch || stepsMatch || tipsMatch)
      );
    });
  }, [searchQuery, selectedCategory]);

  const activeGuide = useMemo(() => {
    return (
      filteredGuides.find((g) => g.id === activeGuideId) ||
      filteredGuides[0] ||
      SYSTEM_GUIDES[0]
    );
  }, [filteredGuides, activeGuideId]);

  if (!isOpen) return null;

  const handleCopySteps = (guide) => {
    const text = [
      `Guide: ${guide.title}`,
      `Location: ${guide.breadcrumb}`,
      `Steps:`,
      ...guide.steps.map((s, idx) => `${idx + 1}. ${s}`),
      guide.tips ? `Tip: ${guide.tips}` : ''
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopiedSteps(true);
    setTimeout(() => setCopiedSteps(false), 2000);
  };

  const handleExecuteAction = (guide) => {
    if (guide.actionModal && onOpenModal) {
      onOpenModal(guide.actionModal);
    } else if (guide.actionTab && onNavigate) {
      onNavigate(guide.actionTab);
    }
    onClose();
  };

  const categories = [
    { id: 'all', label: 'All Guides' },
    { id: 'tasks', label: 'Tasks & Boards' },
    { id: 'time', label: 'Time & Reports' },
    { id: 'training', label: 'Training & SOPs' },
    { id: 'projects', label: 'Projects' },
    { id: 'team', label: 'Team & Onboarding' },
    { id: 'settings', label: 'Settings & Security' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-4xl h-[90vh] max-h-[820px] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden text-slate-800"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="help-modal-title" className="font-bold text-base sm:text-lg tracking-tight">
                  System Guide & Problem Solver
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Interactive
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Write your problem or search what you need — get exact step-by-step navigation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            aria-label="Close guide modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Problem Input */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200/80 shrink-0 space-y-3">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="What issue are you facing or trying to find? (e.g. 'can't find tasks', 'how to log time', 'videos', 'kanban')..."
              className="w-full pl-11 pr-10 py-3 bg-white text-slate-900 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-xs placeholder-slate-400"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-200/60 text-slate-600 border border-slate-200/70'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Quick Problem Problem Suggestion Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[11px]">
            <span className="text-slate-400 font-semibold shrink-0">Common:</span>
            {[
              { label: 'Find my tasks', id: 'find_my_tasks' },
              { label: 'Log hours', id: 'log_work_hours' },
              { label: 'Create task', id: 'create_new_task' },
              { label: 'Instruction videos', id: 'instruction_videos' },
              { label: 'XP & Leaderboard', id: 'leaderboard_xp' },
              { label: 'Onboard member', id: 'onboard_new_member' },
              { label: 'Change language', id: 'change_language_pack' }
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  setActiveGuideId(chip.id);
                  setSelectedCategory('all');
                }}
                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 font-medium transition-colors shrink-0 border border-slate-200/60 cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body: Split Left List & Right Step-by-Step Viewer */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Left Column: Guides matching query */}
          <div className="w-full md:w-5/12 border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
              <span>Matching Guides & Topics ({filteredGuides.length})</span>
            </div>

            {filteredGuides.length === 0 ? (
              <div className="p-6 text-center space-y-2 bg-white rounded-xl border border-dashed border-slate-200 mt-2">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">No exact guide found for "{searchQuery}"</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Try searching for keywords like <strong>task</strong>, <strong>log</strong>, <strong>video</strong>, <strong>project</strong>, <strong>onboarding</strong>, or <strong>leaderboard</strong>.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="mt-2 text-xs text-emerald-600 font-semibold hover:underline"
                >
                  Clear search & show all guides
                </button>
              </div>
            ) : (
              filteredGuides.map((guide) => {
                const IconComponent = guide.icon;
                const isSelected = activeGuide?.id === guide.id;
                return (
                  <div
                    key={guide.id}
                    onClick={() => setActiveGuideId(guide.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-white border-emerald-500 shadow-sm ring-1 ring-emerald-500/20'
                        : 'bg-white hover:bg-slate-100/70 border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <h4
                            className={`text-xs font-bold truncate ${
                              isSelected ? 'text-emerald-950 font-bold' : 'text-slate-800'
                            }`}
                          >
                            {guide.title}
                          </h4>
                          {guide.badge && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 shrink-0">
                              {guide.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {guide.summary}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Active Guide Steps & Direct Action */}
          <div className="w-full md:w-7/12 overflow-y-auto p-4 sm:p-6 bg-white flex flex-col justify-between">
            {activeGuide ? (
              <div className="space-y-5">
                {/* Active Guide Header */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      {activeGuide.roles}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 font-medium">
                      Location: <strong className="text-slate-700 font-semibold">{activeGuide.breadcrumb}</strong>
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <activeGuide.icon className="w-5 h-5 text-emerald-600" />
                    <span>{activeGuide.title}</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {activeGuide.summary}
                  </p>
                </div>

                {/* Step-by-Step Way / Steps */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Step-by-Step Directions to Find It</span>
                    </h4>

                    <button
                      type="button"
                      onClick={() => handleCopySteps(activeGuide)}
                      className="text-[11px] text-slate-500 hover:text-emerald-700 flex items-center gap-1 font-medium transition-colors"
                      title="Copy these steps"
                    >
                      {copiedSteps ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Steps</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                    {activeGuide.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pro Tip */}
                {activeGuide.tips && (
                  <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5">
                    <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-900 leading-relaxed">
                      <strong>Pro Tip:</strong> {activeGuide.tips}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center p-8 text-slate-400">
                <p className="text-xs">Select a guide from the left or search your issue.</p>
              </div>
            )}

            {/* Bottom Take Me There Action Bar */}
            {activeGuide && (
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
                <div className="text-[11px] text-slate-500 text-center sm:text-left">
                  Need to go directly? Click below to navigate immediately:
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <a
                    href={`/guide.html?search=${encodeURIComponent(searchQuery || activeGuide.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    title="Open in full documentation page"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Full Guide Page ↗</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleExecuteAction(activeGuide)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <span>{activeGuide.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
