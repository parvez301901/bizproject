import React from 'react';
import { 
  LayoutDashboard, 
  Kanban, 
  UserCheck, 
  Users, 
  FolderKanban, 
  Settings, 
  Plus, 
  ChevronRight,
  Sparkles,
  ShieldCheck,
  History,
  LogIn,
  LogOut,
  ArchiveRestore,
  BookOpen,
  Settings2,
  BarChart3,
  Clock,
  Globe,
  Upload,
  Trophy,
  Megaphone,
  Video,
  DollarSign,
  X
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import brandLogo from '../assets/logo.png';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  projects = [], 
  selectedProject, 
  setSelectedProject, 
  onOpenNewProject, 
  onOpenOnboard,
  currentUser,
  onOpenAuth,
  onLogout,
  deactivatedCount = 0,
  onOpenOverview,
  onOpenLogWork,
  onOpenHelpGuide,
  onOpenSettings,
  isOpen = false,
  onClose
}) {
  const { currentLang, setCurrentLang, availableLanguages, uploadCustomLanguage, t } = useLanguage();
  const fileInputRef = React.useRef(null);
  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const isManagement = isAdmin || isManager;

  const handleNav = (action) => {
    action();
    if (onClose) onClose();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadCustomLanguage(file);
      alert(`Language pack "${res.name}" loaded successfully!`);
    } catch (err) {
      alert(err.message || 'Failed to parse language file');
    }
    e.target.value = '';
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-64 bg-white border-r border-slate-200/80 flex flex-col h-screen select-none shrink-0 shadow-2xl lg:shadow-[1px_0_10px_rgba(0,0,0,0.02)] transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={brandLogo} 
              alt="BizProject Logo" 
              className="w-9 h-9 object-contain rounded-xl shadow-xs" 
            />
            <div>
              <h1 className="font-bold text-slate-800 tracking-tight text-base leading-none">{t('common.appName')}</h1>
              <span className="text-[11px] font-medium text-emerald-600 mt-1 inline-block">{t('common.appTagline')}</span>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      {/* Navigation Sections */}
      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Core Management */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            {isManagement ? t('sidebar.workspace') : 'Team Workspace'}
          </div>
          <nav className="space-y-1">
            {/* Overview */}
            <button
              onClick={() => handleNav(() => setActiveTab(isManagement ? 'dashboard' : 'overview'))}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                (activeTab === 'dashboard' || activeTab === 'overview')
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-600/5 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 ${(activeTab === 'dashboard' || activeTab === 'overview') ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>{isManagement ? (isAdmin ? t('sidebar.adminOverview') : 'Management Overview') : (t('sidebar.myOverview') || 'My Overview')}</span>
            </button>

            {/* Onboarding Panel */}
            <button
              onClick={() => handleNav(() => setActiveTab('onboarding'))}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                activeTab === 'onboarding'
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-600/5 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <UserCheck className={`w-4 h-4 ${activeTab === 'onboarding' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{isManagement ? t('sidebar.onboardingHub') : (t('sidebar.onboardingPanel') || 'Onboarding Panel')}</span>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">New</span>
            </button>

            {/* Admin & Manager: Team Directory */}
            {isManagement && (
              <button
                onClick={() => handleNav(() => setActiveTab('team'))}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                  activeTab === 'team'
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-600/5 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Users className={`w-4 h-4 ${activeTab === 'team' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{t('sidebar.teamDirectory')}</span>
              </button>
            )}

            {/* Message Board */}
            <button
              onClick={() => handleNav(() => setActiveTab('messages'))}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                activeTab === 'messages'
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-600/5 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Megaphone className={`w-4 h-4 ${activeTab === 'messages' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{t('sidebar.messageBoard') || 'Message Board'}</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                HQ
              </span>
            </button>

            {/* Instruction Videos */}
            <button
              onClick={() => handleNav(() => setActiveTab('videos'))}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                activeTab === 'videos'
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-600/5 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Video className={`w-4 h-4 ${activeTab === 'videos' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{t('sidebar.instructionVideos') || 'Instruction Videos'}</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">
                SOP
              </span>
            </button>

            {/* Projects */}
            <button
              onClick={() => handleNav(() => setActiveTab('projects_directory'))}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                activeTab === 'projects_directory'
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-600/5 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <FolderKanban className={`w-4 h-4 ${activeTab === 'projects_directory' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{t('sidebar.projects') || 'Projects'}</span>
              </div>
              {projects.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {projects.length}
                </span>
              )}
            </button>

            {/* Reports */}
            <button
              onClick={() => handleNav(() => setActiveTab('reports'))}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-600/5 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className={`w-4 h-4 ${activeTab === 'reports' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{t('sidebar.reports') || 'Reports'}</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Live
              </span>
            </button>

            {/* Leaderboard */}
            <button
              onClick={() => handleNav(() => setActiveTab('leaderboard'))}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-600/5 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Trophy className={`w-4 h-4 ${activeTab === 'leaderboard' ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                <span>{t('sidebar.leaderboard') || 'Leaderboard'}</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                XP 🏆
              </span>
            </button>

            {/* Earnings & Rewards Menu */}
            <button
              onClick={() => handleNav(() => setActiveTab('earnings'))}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                activeTab === 'earnings'
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-600/5 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <DollarSign className={`w-4 h-4 ${activeTab === 'earnings' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{t('sidebar.earnings') || 'Earnings'}</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                $$$
              </span>
            </button>

            {/* Admin & Manager: Recovery Vault & Audit Logs */}
            {isManagement && (
              <>
                <button
                  onClick={() => handleNav(() => setActiveTab('deactivated'))}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                    activeTab === 'deactivated'
                      ? 'bg-amber-50 text-amber-800 shadow-sm shadow-amber-600/5 font-semibold border border-amber-200/50'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ArchiveRestore className={`w-4 h-4 ${activeTab === 'deactivated' ? 'text-amber-600' : 'text-slate-400'}`} />
                    <span>Recovery Vault</span>
                  </div>
                  {deactivatedCount > 0 && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {deactivatedCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleNav(() => setActiveTab('logs'))}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                    activeTab === 'logs'
                      ? 'bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-600/5 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <History className={`w-4 h-4 ${activeTab === 'logs' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>Audit Trail (Logs)</span>
                </button>
              </>
            )}

            {/* Documentation & How-To Guide (Available for both Member & Admin) */}
            <button
              type="button"
              onClick={() => handleNav(() => {
                if (onOpenHelpGuide) {
                  onOpenHelpGuide();
                } else {
                  window.open('/guide.html', '_blank');
                }
              })}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Help & How-To Guide</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Steps
              </span>
            </button>
          </nav>
        </div>

        {/* Projects / Boards (Assigned for team members, all for admin/manager) */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            <span>{isManagement ? 'Projects & Boards' : 'Assigned Boards'}</span>
            {isManagement && (
              <button 
                onClick={() => handleNav(onOpenNewProject)}
                className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
                title="Create new project"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="space-y-1">
            {projects.length === 0 ? (
              <div className="px-3 py-2 text-[11px] text-slate-400 italic">
                {isManagement ? 'No projects yet.' : 'No projects assigned by admin.'}
              </div>
            ) : (
              projects.map((proj) => {
                const isSelected = activeTab === 'project' && selectedProject?.id === proj.id;
                return (
                  <div
                    key={proj.id}
                    className={`group relative flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <button
                      onClick={() => {
                        handleNav(() => {
                          setSelectedProject(proj);
                          setActiveTab('project');
                        });
                      }}
                      className="flex-1 flex items-center gap-2.5 truncate text-left cursor-pointer"
                    >
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: proj.color || '#10b981' }} 
                      />
                      <span className="truncate">{proj.name}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {onOpenOverview && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProject(proj);
                            onOpenOverview(proj);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-emerald-100/60 text-slate-400 hover:text-emerald-700 transition-opacity cursor-pointer"
                          title="Quick View Project Overview & Specs"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <ChevronRight className={`w-3.5 h-3.5 text-slate-400 ${isSelected ? 'rotate-90 text-emerald-600' : ''}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Employee Action (Admin: Fast hire setup, Team: Log work time) */}
        {isAdmin ? (
          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-800 font-medium text-xs mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Fast Hire Setup</span>
            </div>
            <p className="text-[11px] text-emerald-700/80 mb-2 leading-relaxed">
              Invite candidates and automatically provision tasks & checklists.
            </p>
            <div className="space-y-1.5">
              <button
                onClick={() => handleNav(onOpenOnboard)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-2 px-3 rounded-lg shadow-sm shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Onboard Employee</span>
              </button>

              {onOpenLogWork && (
                <button
                  onClick={() => handleNav(onOpenLogWork)}
                  className="w-full bg-white hover:bg-emerald-50 text-emerald-800 font-semibold text-xs py-1.5 px-3 rounded-lg border border-emerald-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t('sidebar.logWorkTime')}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          onOpenLogWork && (
            <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-semibold text-xs">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Track Productivity</span>
              </div>
              <p className="text-[11px] text-emerald-700/80 leading-relaxed">
                Log your completed tasks and hours to maintain leaderboard standing.
              </p>
              <button
                onClick={() => handleNav(onOpenLogWork)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 px-3 rounded-lg shadow-sm shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{t('sidebar.logWorkTime')}</span>
              </button>
            </div>
          )
        )}

        {/* Language Selection & Custom JSON Upload Section */}
        <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('common.language')}</span>
            </span>
            <span className="text-[10px] uppercase font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              {currentLang}
            </span>
          </div>

          {/* Language Switch Dropdown */}
          <select
            value={currentLang}
            onChange={(e) => setCurrentLang(e.target.value)}
            className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-emerald-500 shadow-2xs"
          >
            {availableLanguages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>

          {/* Upload Custom JSON Button (Admin & Manager only) */}
          {isManagement && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json,application/json"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-[11px] font-medium rounded-lg border border-dashed border-slate-300 hover:border-emerald-400 transition-colors cursor-pointer"
                title="Upload Swedish or any custom language JSON file"
              >
                <Upload className="w-3 h-3 text-emerald-600" />
                <span>{t('sidebar.uploadCustomLang')}</span>
              </button>

              {isAdmin && onOpenSettings && (
                <button
                  onClick={() => handleNav(onOpenSettings)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium rounded-lg transition-colors cursor-pointer mt-1"
                  title="Configure workspace display & developer indicator settings"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-600" />
                  <span>Workspace Settings</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer Profile & Auth Control */}
      <div className="p-3 border-t border-slate-100">
        {currentUser ? (
          <div className="flex items-center justify-between">
            <button 
              type="button"
              onClick={() => handleNav(() => setActiveTab('overview'))}
              className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-85 transition-opacity cursor-pointer group"
              title="Go to My Overview"
            >
              <img
                src={currentUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.full_name)}`}
                alt={currentUser.full_name}
                className="w-8 h-8 rounded-full ring-2 ring-emerald-400/30 group-hover:ring-emerald-500/60 object-cover transition-all"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-emerald-700 transition-colors">{currentUser.full_name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                    Lvl {currentUser.level || 1}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 font-semibold">
                    {currentUser.xp || 0} XP
                  </span>
                </div>
              </div>
            </button>
            <button 
              onClick={() => handleNav(onLogout)}
              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleNav(onOpenAuth)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold transition-all border border-slate-200 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sign In / Register</span>
          </button>
        )}
      </div>
    </aside>
    </>
  );
}
