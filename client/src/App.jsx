import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Kanban, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  Filter, 
  Sparkles,
  Share2,
  MoreHorizontal,
  LogIn,
  UserCheck,
  BookOpen,
  Edit3,
  Activity,
  CheckCircle,
  Rocket,
  FlaskConical,
  Code2,
  Menu,
  Bell,
  Megaphone
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import AdminOverview from './components/AdminOverview';
import OnboardingHub from './components/OnboardingHub';
import TeamDirectory from './components/TeamDirectory';
import MondayTable from './components/MondayTable';
import KanbanBoard from './components/KanbanBoard';
import TaskModal from './components/TaskModal';
import OnboardModal from './components/OnboardModal';
import NewProjectModal from './components/NewProjectModal';
import EditProjectModal from './components/EditProjectModal';
import ProjectOverviewModal from './components/ProjectOverviewModal';
import AuthModal from './components/AuthModal';
import AuditLogView from './components/AuditLogView';
import DeactivatedMembers from './components/DeactivatedMembers';
import WorkReportView from './components/WorkReportView';
import LogWorkModal from './components/LogWorkModal';
import ProjectsDirectoryView from './components/ProjectsDirectoryView';
import LeaderboardView from './components/LeaderboardView';
import MessageBoardView from './components/MessageBoardView';
import InstructionVideosView from './components/InstructionVideosView';
import ImportantNoticeModal from './components/ImportantNoticeModal';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('project'); // 'dashboard', 'onboarding', 'team', 'messages', 'videos', 'reports', 'deactivated', 'project', 'logs'
  const [projectViewMode, setProjectViewMode] = useState('table'); // 'table', 'kanban'
  
  // Auth state - Require real authentication
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('apex_user');
    const token = localStorage.getItem('apex_token');
    if (saved && token) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Validate session on mount
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('apex_token');
      if (!token) {
        setCurrentUser(null);
        return;
      }
      try {
        const res = await api.getMe(token);
        if (res && res.user) {
          setCurrentUser(res.user);
          localStorage.setItem('apex_user', JSON.stringify(res.user));
        } else {
          setCurrentUser(null);
        }
      } catch (e) {
        console.warn('Session verification error:', e);
      }
    };
    verifySession();
  }, []);

  // Data states
  const [stats, setStats] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [boardData, setBoardData] = useState({ board: null, tasks: [] });

  const activeUsers = allUsers.filter(u => u.status !== 'deactivated');
  const deactivatedUsers = allUsers.filter(u => u.status === 'deactivated');
  
  // Modal states
  const [inspectedTask, setInspectedTask] = useState(null);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showProjectOverviewModal, setShowProjectOverviewModal] = useState(false);
  const [showLogWorkModal, setShowLogWorkModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [importantNoticeCount, setImportantNoticeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Initial load
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, projectsRes] = await Promise.all([
        api.getStats(),
        api.getUsers(true),
        api.getProjects()
      ]);

      setStats(statsRes);
      setAllUsers(usersRes);
      setProjects(projectsRes);

      if (projectsRes.length > 0 && !selectedProject) {
        setSelectedProject(projectsRes[0]);
      }

      // Check for important notices count
      try {
        const msgs = await api.getMessages({ user_id: currentUser?.id });
        const importantOnes = (msgs || []).filter(m => 
          m.is_pinned || 
          m.priority === 'Urgent' || 
          m.priority === 'Important'
        );
        setImportantNoticeCount(importantOnes.length);
      } catch (err) {
        console.warn('Could not fetch message count:', err);
      }
    } catch (e) {
      console.error('Error fetching initial data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Fetch board data when selectedProject changes
  const loadProjectBoard = async (projectId) => {
    if (!projectId) return;
    try {
      const data = await api.getProjectBoard(projectId);
      setBoardData(data);
    } catch (e) {
      console.error('Error fetching board data:', e);
    }
  };

  useEffect(() => {
    if (selectedProject) {
      loadProjectBoard(selectedProject.id);
    }
  }, [selectedProject?.id]);

  // Auth Handlers
  const handleAuthSuccess = (user, token) => {
    setCurrentUser(user);
    localStorage.setItem('apex_user', JSON.stringify(user));
    if (token) localStorage.setItem('apex_token', token);
    setShowAuthModal(false);
    loadInitialData();
  };

  const handleLogout = () => {
    localStorage.removeItem('apex_user');
    localStorage.removeItem('apex_token');
    setCurrentUser(null);
    setShowAuthModal(true);
  };

  // Task Handlers (Pass actor_name for universal audit logging)
  const handleCreateTask = async (taskPayload) => {
    if (!boardData.board) return;
    try {
      const created = await api.createTask({
        board_id: boardData.board.id,
        actor_name: currentUser?.full_name || 'Admin',
        ...taskPayload
      });
      setBoardData(prev => ({
        ...prev,
        tasks: [created, ...prev.tasks]
      }));
      api.getStats().then(setStats).catch(console.error);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      // Optimistic update
      setBoardData(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
      }));

      const updated = await api.updateTask(taskId, {
        ...updates,
        actor_name: currentUser?.full_name || 'Admin'
      });
      setBoardData(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? updated : t)
      }));

      if (inspectedTask && inspectedTask.id === taskId) {
        setInspectedTask(updated);
      }
      api.getStats().then(setStats).catch(console.error);
    } catch (e) {
      console.error(e);
      if (selectedProject) loadProjectBoard(selectedProject.id);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.deleteTask(taskId, currentUser?.full_name || 'Admin');
      setBoardData(prev => ({
        ...prev,
        tasks: prev.tasks.filter(t => t.id !== taskId)
      }));
      api.getStats().then(setStats).catch(console.error);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkUpdate = async (taskIds, action, value) => {
    try {
      await api.bulkUpdateTasks(taskIds, action, value, currentUser?.full_name || 'Admin');
      if (selectedProject) loadProjectBoard(selectedProject.id);
      api.getStats().then(setStats).catch(console.error);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 antialiased overflow-hidden font-sans">
      {/* Sleek Sidebar with Light Green Theme & Auth Controls */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        projects={projects}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        onOpenNewProject={() => setShowNewProjectModal(true)}
        onOpenOnboard={() => setShowOnboardModal(true)}
        currentUser={currentUser}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        deactivatedCount={deactivatedUsers.length}
        onOpenOverview={(proj) => {
          setSelectedProject(proj);
          setShowProjectOverviewModal(true);
        }}
        onOpenLogWork={() => setShowLogWorkModal(true)}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Top Navigation Header (visible only on < lg) */}
        <div className="lg:hidden bg-white border-b border-slate-200/90 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-2xs z-30">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 -ml-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-2xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-800 text-sm tracking-tight">Apex Workspace</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Important Notice Button (Mobile) */}
            <button
              onClick={() => setShowNoticeModal(true)}
              className="relative p-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors cursor-pointer"
              title="View Important Notices"
              aria-label="Important Notices"
            >
              <Bell className="w-4 h-4" />
              {importantNoticeCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {importantNoticeCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowLogWorkModal(true)}
              className="px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              title="Log Work"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Log</span>
            </button>
            {currentUser ? (
              <div
                onClick={() => setShowAuthModal(true)}
                className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center cursor-pointer border border-emerald-300"
                title={currentUser.full_name}
              >
                {currentUser.full_name?.charAt(0) || 'U'}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-xs px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-medium cursor-pointer"
              >
                Login
              </button>
            )}
          </div>
        </div>

        {/* Project View Header (if on project tab) */}
        {activeTab === 'project' && selectedProject && (
          <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span 
                  className="w-3.5 h-3.5 rounded-full ring-2 ring-emerald-500/20 shrink-0" 
                  style={{ backgroundColor: selectedProject.color || '#10b981' }} 
                />
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{selectedProject.name}</h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  {boardData.tasks.length} Tasks
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-xl truncate">{selectedProject.description || 'Enterprise execution board'}</p>
            </div>

            {/* View Switcher Pills & Actions */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                <button
                  onClick={() => setProjectViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    projectViewMode === 'table'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Main Table</span>
                </button>
                <button
                  onClick={() => setProjectViewMode('kanban')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    projectViewMode === 'kanban'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Kanban className="w-3.5 h-3.5" />
                  <span>Kanban</span>
                </button>
              </div>

              {/* Overview & Edit Project Action Buttons */}
              <button
                onClick={() => setShowProjectOverviewModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200/90 shadow-2xs transition-all cursor-pointer"
                title="View Markdown features, architecture, and PDF guide"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Overview & Specs</span>
                <span className="sm:hidden">Specs</span>
              </button>

              <button
                onClick={() => setShowEditProjectModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200/90 shadow-2xs transition-all cursor-pointer"
                title="Edit project details, folder link, and documentation"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Edit Project</span>
                <span className="sm:hidden">Edit</span>
              </button>

              <button
                onClick={() => handleCreateTask({ title: 'New Item', status: 'To Do', priority: 'Medium' })}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Task</span>
              </button>

              {/* Important Notice Button (Desktop Project Header) */}
              <button
                onClick={() => setShowNoticeModal(true)}
                className="relative inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs border border-amber-300 shadow-2xs transition-all cursor-pointer"
                title="View Important Company Notices & Directives"
              >
                <Bell className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Notice</span>
                {importantNoticeCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 bg-rose-600 text-white text-[10px] font-bold rounded-full animate-pulse">
                    {importantNoticeCount}
                  </span>
                )}
              </button>
            </div>
          </header>
        )}

        {/* Project Lifecycle & Completion Progress Bar (Configured by Admin) */}
        {activeTab === 'project' && selectedProject && (
          <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 shadow-2xs">
            <div className="flex items-center gap-3">
              {/* Lifecycle Stage Badge */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stage:</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                  selectedProject.lifecycle_stage === 'Production'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 ring-2 ring-emerald-500/20'
                    : selectedProject.lifecycle_stage === 'Testing & QA'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 ring-2 ring-amber-500/20'
                    : selectedProject.lifecycle_stage === 'Staging'
                    ? 'bg-sky-100 text-sky-800 border border-sky-300 ring-2 ring-sky-500/20'
                    : selectedProject.lifecycle_stage === 'Maintenance'
                    ? 'bg-purple-100 text-purple-800 border border-purple-300'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  {selectedProject.lifecycle_stage === 'Production' && <Rocket className="w-3.5 h-3.5 text-emerald-600" />}
                  {selectedProject.lifecycle_stage === 'Testing & QA' && <FlaskConical className="w-3.5 h-3.5 text-amber-600" />}
                  {selectedProject.lifecycle_stage === 'Staging' && <Activity className="w-3.5 h-3.5 text-sky-600" />}
                  {(!selectedProject.lifecycle_stage || selectedProject.lifecycle_stage === 'Development' || selectedProject.lifecycle_stage === 'Ideation & Spec') && (
                    <Code2 className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span>{selectedProject.lifecycle_stage || 'Development'}</span>
                </span>
              </div>

              {/* Status Pill */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
                <span className="text-slate-300">•</span>
                <span className="font-medium text-slate-600">Status:</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {selectedProject.status ? selectedProject.status.replace('_', ' ') : 'Active'}
                </span>
              </div>
            </div>

            {/* Progress Bar & Quick Adjust */}
            <div className="flex items-center gap-4 flex-1 max-w-md justify-end">
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-semibold text-slate-500">Project Completion:</span>
                  <span className="font-bold font-mono text-emerald-700">
                    {selectedProject.progress_percent !== undefined ? selectedProject.progress_percent : 0}%
                  </span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/80 p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (selectedProject.progress_percent || 0) >= 100
                        ? 'bg-emerald-600 shadow-xs shadow-emerald-500/50'
                        : (selectedProject.progress_percent || 0) >= 70
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        : (selectedProject.progress_percent || 0) >= 30
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, selectedProject.progress_percent || 0))}%` }}
                  />
                </div>
              </div>

              {/* Quick Update Button (opens edit modal directly) */}
              <button
                onClick={() => setShowEditProjectModal(true)}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline shrink-0 cursor-pointer"
                title="Change project completion percentage or production stage"
              >
                Set %
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Workspace View */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <AdminOverview
              stats={stats}
              onNavigateToOnboard={() => setActiveTab('onboarding')}
              onNavigateToProject={() => setActiveTab('project')}
              onNavigateToLeaderboard={() => setActiveTab('leaderboard')}
              currentUser={currentUser}
              onOpenLogWork={() => setShowLogWorkModal(true)}
              onOpenNotice={() => setShowNoticeModal(true)}
            />
          )}

          {activeTab === 'leaderboard' && (
            <LeaderboardView
              currentUser={currentUser}
              onOpenLogWork={() => setShowLogWorkModal(true)}
            />
          )}

          {activeTab === 'onboarding' && (
            <OnboardingHub
              users={activeUsers}
              onRefresh={loadInitialData}
              onOpenOnboardModal={() => setShowOnboardModal(true)}
            />
          )}

          {activeTab === 'team' && (
            <TeamDirectory
              users={activeUsers}
              onRefresh={loadInitialData}
              onOpenOnboardModal={() => setShowOnboardModal(true)}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'messages' && (
            <MessageBoardView
              users={activeUsers}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'videos' && (
            <InstructionVideosView
              users={activeUsers}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'projects_directory' && (
            <ProjectsDirectoryView
              projects={projects}
              currentUser={currentUser}
              onSelectProject={(proj) => {
                setSelectedProject(proj);
                setActiveTab('project');
              }}
              onOpenNewProject={() => setShowNewProjectModal(true)}
              onOpenOverview={(proj) => {
                setSelectedProject(proj);
                setShowProjectOverviewModal(true);
              }}
              onEditProject={(proj) => {
                setSelectedProject(proj);
                setShowEditProjectModal(true);
              }}
              onOpenLogWork={() => setShowLogWorkModal(true)}
              onRefreshProjects={loadInitialData}
            />
          )}

          {activeTab === 'reports' && (
            <WorkReportView
              users={activeUsers}
              projects={projects}
              onOpenLogWork={() => setShowLogWorkModal(true)}
            />
          )}

          {activeTab === 'deactivated' && (
            <DeactivatedMembers
              deactivatedUsers={deactivatedUsers}
              onRefresh={loadInitialData}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'logs' && (
            <AuditLogView />
          )}

          {activeTab === 'project' && selectedProject && (
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto animate-fadeIn">
              {projectViewMode === 'table' ? (
                <MondayTable
                  tasks={boardData.tasks}
                  users={activeUsers}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onBulkUpdate={handleBulkUpdate}
                  onOpenTaskModal={setInspectedTask}
                  onAddTask={handleCreateTask}
                />
              ) : (
                <KanbanBoard
                  tasks={boardData.tasks}
                  users={activeUsers}
                  onUpdateTask={handleUpdateTask}
                  onOpenTaskModal={setInspectedTask}
                  onAddTask={handleCreateTask}
                />
              )}
            </div>
          )}
        </div>
      </main>

      {/* Task Details Modal */}
      {inspectedTask && (
        <TaskModal
          task={inspectedTask}
          users={activeUsers}
          currentUser={currentUser}
          onClose={() => setInspectedTask(null)}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onOpenLogWork={(t) => {
            setInspectedTask(t);
            setShowLogWorkModal(true);
          }}
        />
      )}

      {/* Onboard Employee Modal */}
      {showOnboardModal && (
        <OnboardModal
          onClose={() => setShowOnboardModal(false)}
          onCreated={loadInitialData}
        />
      )}

      {/* New Project Modal */}
      {showNewProjectModal && (
        <NewProjectModal
          onClose={() => setShowNewProjectModal(false)}
          onCreated={async () => {
            const freshProjects = await api.getProjects();
            setProjects(freshProjects);
            if (freshProjects.length > 0) {
              setSelectedProject(freshProjects[0]);
            }
          }}
        />
      )}

      {/* Project Overview Modal (Markdown & PDF viewer) */}
      {showProjectOverviewModal && selectedProject && (
        <ProjectOverviewModal
          project={selectedProject}
          onClose={() => setShowProjectOverviewModal(false)}
          onEdit={(proj) => {
            setSelectedProject(proj);
            setShowEditProjectModal(true);
          }}
          currentUser={currentUser}
        />
      )}

      {/* Edit Project Modal */}
      {showEditProjectModal && selectedProject && (
        <EditProjectModal
          project={selectedProject}
          onClose={() => setShowEditProjectModal(false)}
          onUpdated={async () => {
            const freshProjects = await api.getProjects();
            setProjects(freshProjects);
            const freshCurrent = freshProjects.find(p => p.id === selectedProject.id);
            if (freshCurrent) {
              setSelectedProject(freshCurrent);
            }
          }}
          currentUser={currentUser}
        />
      )}

      {/* Log Work Time Modal */}
      {showLogWorkModal && (
        <LogWorkModal
          onClose={() => setShowLogWorkModal(false)}
          onLogged={loadInitialData}
          currentUser={currentUser}
          projects={projects}
          users={activeUsers}
          preselectedTask={inspectedTask}
        />
      )}

      {/* Authentication Modal */}
      {(!currentUser || showAuthModal) && (
        <AuthModal
          isRequired={!currentUser}
          onClose={() => {
            if (currentUser) setShowAuthModal(false);
          }}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {/* Important Notice Modal */}
      <ImportantNoticeModal
        isOpen={showNoticeModal}
        onClose={() => setShowNoticeModal(false)}
        currentUser={currentUser}
        onOpenMessageBoard={() => {
          setActiveTab('messages');
          setShowNoticeModal(false);
        }}
      />
    </div>
  );
}
