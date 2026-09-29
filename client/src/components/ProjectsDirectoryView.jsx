import React, { useState } from 'react';
import {
  FolderKanban,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ArrowUpRight,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  Calendar,
  Layers,
  X,
  ExternalLink,
  BookOpen,
  FileText,
  Timer,
  Activity,
  Check,
  Server,
  GitBranch,
  ShieldCheck,
  HardDrive,
  LayoutGrid,
  List,
  PanelRightClose,
  PanelRight,
  Trash2,
  Archive,
  RotateCcw,
  Database,
  Code2,
  Cpu,
  FolderSync,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import DeleteProjectModal from './DeleteProjectModal';
import ProjectSyncModal from './ProjectSyncModal';

export default function ProjectsDirectoryView({
  projects = [],
  currentUser,
  onSelectProject,
  onOpenNewProject,
  onOpenOverview,
  onEditProject,
  onOpenLogWork,
  onRefreshProjects
}) {
  const { t } = useLanguage();
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' (default) | 'table'
  const [showInspector, setShowInspector] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState('all'); // all, f_antigravity, c_xampp
  const [filterStage, setFilterStage] = useState('all'); // all, Production, Testing & QA, Staging, Development, Ideation, Maintenance
  const [filterStatus, setFilterStatus] = useState('all'); // all, has_issues, completed, active
  const [filterTech, setFilterTech] = useState('all');
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || null);

  const canViewInfrastructure = !currentUser || currentUser.role === 'admin' || currentUser.role === 'manager';

  // Gather unique technologies across all projects for quick filter
  const allAvailableTechnologies = Array.from(new Set(
    projects.flatMap(p => p.tech?.allTags || [])
  )).sort();

  // Filter projects by search term, lifecycle stage, status, source root, and technology
  const filteredProjects = projects.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    const techTags = (p.tech?.allTags || []).map(t => t.toLowerCase()).join(' ');
    const matchesSearch = !term || 
      p.name.toLowerCase().includes(term) ||
      (p.description && p.description.toLowerCase().includes(term)) ||
      (p.project_folder && p.project_folder.toLowerCase().includes(term)) ||
      (p.location_path && p.location_path.toLowerCase().includes(term)) ||
      (p.server_name && p.server_name.toLowerCase().includes(term)) ||
      (p.lifecycle_stage && p.lifecycle_stage.toLowerCase().includes(term)) ||
      techTags.includes(term);

    const matchesStage = filterStage === 'all' || p.lifecycle_stage === filterStage;

    const matchesTech = filterTech === 'all' || 
      (p.tech?.allTags && p.tech.allTags.includes(filterTech));

    let matchesSource = true;
    if (filterSource === 'f_antigravity') {
      matchesSource = (p.location_path && p.location_path.toLowerCase().includes('f:/antigravity')) ||
                      (!p.location_path && p.project_folder);
    } else if (filterSource === 'c_xampp') {
      matchesSource = (p.location_path && p.location_path.toLowerCase().includes('c:/xampp/htdocs'));
    }

    let matchesStatus = true;
    const hasIssues = (p.blocked_task_count > 0) || (p.overdue_task_count > 0);
    if (filterStatus === 'has_issues') {
      matchesStatus = hasIssues && p.status !== 'archived';
    } else if (filterStatus === 'completed') {
      matchesStatus = ((p.progress_percent >= 100) || (p.lifecycle_stage === 'Production')) && p.status !== 'archived';
    } else if (filterStatus === 'active') {
      matchesStatus = p.status === 'active';
    } else if (filterStatus === 'archived') {
      matchesStatus = p.status === 'archived';
    } else if (filterStatus === 'all') {
      // By default in 'all', hide archived unless explicitly searching or viewing archived
      matchesStatus = p.status !== 'archived';
    }

    return matchesSearch && matchesStage && matchesTech && matchesSource && matchesStatus;
  });

  // Calculate active project for detail panel
  const activeProject = projects.find(p => p.id === selectedProjectId) || filteredProjects[0] || projects[0] || null;

  // Aggregate project statistics
  const totalProjects = projects.length;
  const productionCount = projects.filter(p => p.lifecycle_stage === 'Production').length;
  const testingCount = projects.filter(p => p.lifecycle_stage === 'Testing & QA').length;
  const totalIssuesCount = projects.reduce((sum, p) => sum + (Number(p.blocked_task_count) || 0) + (Number(p.overdue_task_count) || 0), 0);
  const avgProgress = totalProjects > 0 
    ? Math.round(projects.reduce((sum, p) => sum + (Number(p.progress_percent) || 0), 0) / totalProjects) 
    : 0;

  // Lifecycle stage pill helper
  const getStageBadge = (stage) => {
    switch (stage) {
      case 'Production':
        return { label: 'Production', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'Testing & QA':
        return { label: 'Testing & QA', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'Staging':
        return { label: 'Staging', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'Development':
        return { label: 'Development', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'Ideation':
        return { label: 'Ideation', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'Maintenance':
        return { label: 'Maintenance', bg: 'bg-slate-100 text-slate-700 border-slate-300' };
      default:
        return { label: stage || 'Active', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Banner / Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/80">
            <FolderKanban className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('projectsDirectory.badge')}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('projectsDirectory.title')}
          </h1>
          <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
            {t('projectsDirectory.subtitle')}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowSyncModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-semibold text-xs border border-slate-200 hover:border-emerald-200 transition-all cursor-pointer shadow-2xs"
            title="Sync all projects between local disk and live server"
          >
            <FolderSync className="w-4 h-4 text-emerald-600" />
            <span>Sync Live / Local</span>
          </button>

          <button
            onClick={onOpenNewProject}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('projectsDirectory.createNewBtn')}</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">{t('projectsDirectory.kpiTotal')}</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {totalProjects}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{t('projectsDirectory.kpiPortfolio')}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FolderKanban className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">{t('projectsDirectory.kpiAvgProgress')}</p>
            <h3 className="text-2xl font-extrabold text-emerald-700 mt-1">
              {avgProgress}%
            </h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">{t('projectsDirectory.kpiOverall')}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">{t('projectsDirectory.kpiStages')}</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {productionCount} Prod <span className="text-sm font-medium text-slate-400">/ {testingCount} QA</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{t('projectsDirectory.kpiReady')}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">{t('projectsDirectory.kpiIssues')}</p>
            <h3 className={`text-2xl font-extrabold mt-1 ${totalIssuesCount > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
              {totalIssuesCount}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{t('projectsDirectory.kpiBlockedOrOverdue')}</p>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${totalIssuesCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {totalIssuesCount > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Main Layout: Left Side Projects Grid/Table (8 or 12 cols) vs Right Side Instant Progress & Issues Hub (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* Left Side: Projects Search & Master List (8 cols or 12 cols if inspector closed) */}
        <div className={`${showInspector ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden transition-all duration-300`}>
          {/* Filter & Search Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col gap-3.5">
            {/* Row 1: Full-Width Dedicated Search Bar */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder={t('projectsDirectory.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 text-xs bg-slate-50 border border-slate-200/90 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium text-slate-800 placeholder-slate-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Row 2: Quick Filters & View Switchers in a Single Row */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-100/80">
              <div className="flex flex-wrap items-center gap-2">
                {/* Source Root Filter (F:\antigravity vs C:\xampp\htdocs) */}
                {canViewInfrastructure && (
                  <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:border-emerald-500 shadow-2xs"
                  >
                    <option value="all">All Drives & Roots ({projects.length})</option>
                    <option value="f_antigravity">📁 F:\antigravity</option>
                    <option value="c_xampp">🌐 C:\xampp\htdocs</option>
                  </select>
                )}

                {/* Lifecycle Stage Filter */}
                <select
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:border-emerald-500 shadow-2xs"
                >
                  <option value="all">{t('projectsDirectory.allStages')}</option>
                  <option value="Production">Production</option>
                  <option value="Testing & QA">Testing & QA</option>
                  <option value="Staging">Staging</option>
                  <option value="Development">Development</option>
                  <option value="Ideation">Ideation</option>
                  <option value="Maintenance">Maintenance</option>
                </select>

                {/* Problem / Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:border-emerald-500 shadow-2xs"
                >
                  <option value="all">{t('projectsDirectory.allStatus')}</option>
                  <option value="active">{t('projectsDirectory.activeStatus')}</option>
                  <option value="has_issues">{t('projectsDirectory.hasIssues')}</option>
                  <option value="completed">{t('projectsDirectory.completed')}</option>
                  <option value="archived">Archived Vault</option>
                </select>

                {/* Technology Filter */}
                {allAvailableTechnologies.length > 0 && (
                  <select
                    value={filterTech}
                    onChange={(e) => setFilterTech(e.target.value)}
                    className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:border-emerald-500 shadow-2xs"
                  >
                    <option value="all">{t('projectsDirectory.allTech') || 'All Technologies'}</option>
                    {allAvailableTechnologies.map(tech => (
                      <option key={tech} value={tech}>⚡ {tech}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* View Switchers & Inspector Panel Toggle */}
              <div className="flex items-center gap-2">
                {/* View Mode Switcher (Cards vs Table) */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewMode === 'cards'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title={t('projectsDirectory.cardsView') || 'Cards'}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t('projectsDirectory.cardsView') || 'Cards'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewMode === 'table'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title={t('projectsDirectory.tableView') || 'Table'}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t('projectsDirectory.tableView') || 'Table'}</span>
                  </button>
                </div>

                {/* Side Panel Inspector Toggle */}
                <button
                  type="button"
                  onClick={() => setShowInspector(!showInspector)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                    showInspector 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                  title={showInspector ? (t('projectsDirectory.hideDetails') || 'Hide Details') : (t('projectsDirectory.showDetails') || 'Show Details')}
                >
                  {showInspector ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRight className="w-3.5 h-3.5" />}
                  <span className="hidden xl:inline">{showInspector ? (t('projectsDirectory.hideDetails') || 'Hide Panel') : (t('projectsDirectory.showDetails') || 'Show Panel')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Project Items: Render Card Grid or Table */}
          {filteredProjects.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 text-sm">
                {t('projectsDirectory.noProjectsFound')}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {t('projectsDirectory.tryAdjusting')}
              </p>
              <button
                onClick={() => { setSearchTerm(''); setFilterStage('all'); setFilterStatus('all'); setFilterSource('all'); }}
                className="mt-3 px-3.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                {t('projectsDirectory.resetFilters')}
              </button>
            </div>
          ) : viewMode === 'cards' ? (
            /* Responsive Card Grid View (Tailored for 1440px and Desktop Screens) */
            <div className={`p-5 grid gap-4.5 ${
              showInspector 
                ? 'grid-cols-1 md:grid-cols-2' 
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4'
            }`}>
              {filteredProjects.map((proj) => {
                const isSelected = activeProject?.id === proj.id;
                const stageBadge = getStageBadge(proj.lifecycle_stage);
                const progress = Number(proj.progress_percent) || 0;
                const blockedCount = Number(proj.blocked_task_count) || 0;
                const overdueCount = Number(proj.overdue_task_count) || 0;
                const issueCount = blockedCount + overdueCount;

                return (
                  <div
                    key={proj.id}
                    onClick={() => setSelectedProjectId(proj.id)}
                    className={`group relative bg-white rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md ${
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/25 bg-emerald-50/15'
                        : 'border-slate-200/90 hover:border-emerald-300'
                    }`}
                  >
                    {/* Top Project Color Accent Bar */}
                    <div
                      className="h-1.5 w-full transition-all"
                      style={{ backgroundColor: proj.color || '#10b981' }}
                    />

                    <div className="p-4.5 flex-1 flex flex-col justify-between space-y-3.5">
                      {/* Header: Project Name & Stage Badge */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-3.5 h-3.5 rounded-md shrink-0 shadow-2xs"
                              style={{ backgroundColor: proj.color || '#10b981' }}
                            />
                            <h3
                              className="font-bold text-slate-900 text-sm truncate group-hover:text-emerald-700 transition-colors"
                              title={proj.name}
                            >
                              {proj.name}
                            </h3>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${stageBadge.bg}`}>
                            {stageBadge.label}
                          </span>
                        </div>

                        {/* Description or Folder Path */}
                        {proj.description ? (
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                            {proj.description}
                          </p>
                        ) : proj.project_folder ? (
                          <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
                            /{proj.project_folder}
                          </p>
                        ) : null}

                        {/* Infrastructure Tags (Location, Server, GitHub, Restricted) */}
                        {canViewInfrastructure && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100">
                            {proj.location_path && (
                              <span
                                className="text-[10px] text-slate-600 bg-slate-100 hover:bg-slate-200/80 px-2 py-0.5 rounded-md font-mono inline-flex items-center gap-1 truncate max-w-[220px]"
                                title={proj.location_path}
                              >
                                <HardDrive className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                                <span className="truncate">{proj.location_path}</span>
                              </span>
                            )}

                            {proj.server_name && (
                              <span className="text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/80 font-medium inline-flex items-center gap-1 truncate max-w-[190px]">
                                <Server className="w-2.5 h-2.5 text-sky-500 shrink-0" />
                                <span className="truncate">{proj.server_name.split(',')[0].replace(' (Node: npm run dev / port 3000)', '').replace(' (XAMPP http://localhost/...)', '')}</span>
                              </span>
                            )}

                            {proj.github_repo && (
                              <a
                                href={proj.github_repo.replace('.git', '')}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 font-mono inline-flex items-center gap-1 transition-colors"
                                title={`GitHub: ${proj.github_repo}`}
                              >
                                <GitBranch className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                <span>Repo</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                              </a>
                            )}

                            {proj.is_restricted ? (
                              <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                Hidden
                              </span>
                            ) : null}
                          </div>
                        )}

                        {/* Tech Stack & Architecture Pills (Frontend, Backend, Database) */}
                        {proj.tech && (proj.tech.frontend?.length > 0 || proj.tech.backend?.length > 0 || proj.tech.database?.length > 0) && (
                          <div className="flex flex-wrap items-center gap-1 mt-2 pt-2 border-t border-slate-100">
                            {/* Frontend Badges */}
                            {proj.tech.frontend?.slice(0, 2).map(f => (
                              <span
                                key={f}
                                className="text-[9px] font-medium text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200/70 inline-flex items-center gap-1"
                                title={`Frontend: ${f}`}
                              >
                                <Code2 className="w-2.5 h-2.5 text-sky-500" />
                                <span>{f}</span>
                              </span>
                            ))}

                            {/* Backend Badges */}
                            {proj.tech.backend?.slice(0, 2).map(b => (
                              <span
                                key={b}
                                className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/70 inline-flex items-center gap-1"
                                title={`Backend: ${b}`}
                              >
                                <Server className="w-2.5 h-2.5 text-emerald-600" />
                                <span>{b}</span>
                              </span>
                            ))}

                            {/* Database Badges */}
                            {proj.tech.database?.slice(0, 1).map(db => (
                              <span
                                key={db}
                                className="text-[9px] font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200/70 inline-flex items-center gap-1"
                                title={`Database: ${db}`}
                              >
                                <Database className="w-2.5 h-2.5 text-indigo-500" />
                                <span>{db}</span>
                              </span>
                            ))}

                            {/* Overflow count if many tech */}
                            {(proj.tech.allTags?.length || 0) > 4 && (
                              <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1 py-0.2 rounded" title={proj.tech.allTags.join(', ')}>
                                +{(proj.tech.allTags?.length || 0) - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Middle: Progress and Health/Issues */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-600 text-[11px]">
                            {t('projectsDirectory.colProgress')}
                          </span>
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            <span className="font-extrabold text-slate-800">{progress}%</span>
                            <span className="text-slate-400 font-normal">
                              ({proj.completed_task_count || 0}/{proj.task_count || 0} tasks)
                            </span>
                          </div>
                        </div>

                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              progress >= 100 
                                ? 'bg-emerald-600' 
                                : progress >= 50 
                                ? 'bg-emerald-500' 
                                : 'bg-emerald-400'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          {/* Blocker/Health status */}
                          <div>
                            {issueCount > 0 ? (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold text-[10px] border border-amber-200"
                                title={`${blockedCount} Blocked, ${overdueCount} Overdue`}
                              >
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                <span>{issueCount} {t('projectsDirectory.issuesCount')}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                <span>{t('projectsDirectory.allGood')}</span>
                              </span>
                            )}
                          </div>

                          {/* Quick action buttons */}
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => onSelectProject(proj)}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title={t('projectsDirectory.openBoard')}
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onOpenOverview && onOpenOverview(proj)}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title={t('projectsDirectory.viewOverview')}
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onEditProject && onEditProject(proj)}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title={t('projectsDirectory.editProject')}
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setProjectToDelete(proj)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Remove / Delete Project"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-4">{t('projectsDirectory.colProject')}</th>
                    <th className="py-3 px-3 text-center">{t('projectsDirectory.colTechStack') || 'Tech Stack'}</th>
                    <th className="py-3 px-3 text-center">{t('projectsDirectory.colStage')}</th>
                    <th className="py-3 px-3 text-center">{t('projectsDirectory.colProgress')}</th>
                    <th className="py-3 px-3 text-center">{t('projectsDirectory.colTasks')}</th>
                    <th className="py-3 px-3 text-center">{t('projectsDirectory.colIssues')}</th>
                    <th className="py-3 px-4 text-right">{t('projectsDirectory.colActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProjects.map((proj) => {
                    const isSelected = activeProject?.id === proj.id;
                    const stageBadge = getStageBadge(proj.lifecycle_stage);
                    const progress = Number(proj.progress_percent) || 0;
                    const blockedCount = Number(proj.blocked_task_count) || 0;
                    const overdueCount = Number(proj.overdue_task_count) || 0;
                    const issueCount = blockedCount + overdueCount;

                    return (
                      <tr
                        key={proj.id}
                        onClick={() => setSelectedProjectId(proj.id)}
                        className={`hover:bg-emerald-50/40 cursor-pointer transition-colors ${
                          isSelected ? 'bg-emerald-50/70 border-l-4 border-l-emerald-600' : ''
                        }`}
                      >
                        {/* Project Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <span
                              className="w-3.5 h-3.5 rounded-md shrink-0 shadow-2xs"
                              style={{ backgroundColor: proj.color || '#10b981' }}
                            />
                            <div>
                              <p className="font-bold text-slate-800 text-xs hover:text-emerald-700 transition-colors flex items-center gap-1.5 flex-wrap">
                                <span>{proj.name}</span>
                                {canViewInfrastructure && proj.server_name && (
                                  <span className="text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200 font-medium">
                                    {proj.server_name.split(',')[0].replace(' (Node: npm run dev / port 3000)', '').replace(' (XAMPP http://localhost/...)', '')}
                                  </span>
                                )}
                                {canViewInfrastructure && proj.github_repo && (
                                  <a
                                    href={proj.github_repo.replace('.git', '')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[10px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-200 font-mono inline-flex items-center gap-1"
                                    title={`GitHub: ${proj.github_repo}`}
                                  >
                                    <GitBranch className="w-2.5 h-2.5" />
                                    <span>Repo</span>
                                  </a>
                                )}
                                {canViewInfrastructure && proj.is_restricted ? (
                                  <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                    Hidden
                                  </span>
                                ) : null}
                              </p>
                              {canViewInfrastructure && proj.location_path ? (
                                <p className="text-[10px] text-slate-400 font-mono truncate max-w-[320px] flex items-center gap-1 mt-0.5">
                                  <HardDrive className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                  <span>{proj.location_path}</span>
                                </p>
                              ) : proj.description ? (
                                <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
                                  {proj.description}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        {/* Tech Stack Badges Cell */}
                        <td className="py-3.5 px-3">
                          <div className="flex flex-wrap items-center justify-center gap-1 max-w-[200px] mx-auto">
                            {proj.tech?.frontend?.slice(0, 1).map(f => (
                              <span key={f} className="text-[9px] font-medium text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200/80 inline-flex items-center gap-1" title={`Frontend: ${f}`}>
                                <Code2 className="w-2.5 h-2.5 text-sky-500" />
                                <span>{f}</span>
                              </span>
                            ))}
                            {proj.tech?.backend?.slice(0, 1).map(b => (
                              <span key={b} className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80 inline-flex items-center gap-1" title={`Backend: ${b}`}>
                                <Server className="w-2.5 h-2.5 text-emerald-600" />
                                <span>{b}</span>
                              </span>
                            ))}
                            {proj.tech?.database?.slice(0, 1).map(db => (
                              <span key={db} className="text-[9px] font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200/80 inline-flex items-center gap-1" title={`Database: ${db}`}>
                                <Database className="w-2.5 h-2.5 text-indigo-500" />
                                <span>{db}</span>
                              </span>
                            ))}
                            {(!proj.tech?.allTags || proj.tech.allTags.length === 0) && (
                              <span className="text-[10px] text-slate-300 font-mono">—</span>
                            )}
                          </div>
                        </td>

                        {/* Lifecycle Stage Badge */}
                        <td className="py-3.5 px-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${stageBadge.bg}`}>
                            {stageBadge.label}
                          </span>
                        </td>

                        {/* Progress Bar & Percentage */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="w-24 mx-auto space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-slate-700">
                              <span>{progress}%</span>
                              <span className="text-slate-400 font-normal">
                                {proj.completed_task_count || 0}/{proj.task_count || 0}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  progress >= 100 
                                    ? 'bg-emerald-600' 
                                    : progress >= 50 
                                    ? 'bg-emerald-500' 
                                    : 'bg-emerald-400'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Tasks Count */}
                        <td className="py-3.5 px-3 text-center font-medium text-slate-600">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-mono">
                            {proj.task_count || 0}
                          </span>
                        </td>

                        {/* Issues / Blocked */}
                        <td className="py-3.5 px-3 text-center">
                          {issueCount > 0 ? (
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-200"
                              title={`${blockedCount} Blocked, ${overdueCount} Overdue`}
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>{issueCount} {t('projectsDirectory.issuesCount')}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{t('projectsDirectory.allGood')}</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                onSelectProject(proj);
                              }}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title={t('projectsDirectory.openBoard')}
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (onOpenOverview) onOpenOverview(proj);
                              }}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title={t('projectsDirectory.viewOverview')}
                            >
                              <BookOpen className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (onEditProject) onEditProject(proj);
                              }}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title={t('projectsDirectory.editProject')}
                            >
                              <SlidersHorizontal className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setProjectToDelete(proj)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Remove / Delete Project"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Instant Progress & Issues Hub (4 cols) */}
        {showInspector && (
          <div className="lg:col-span-4 space-y-5 animate-fadeIn">
          {activeProject ? (
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 space-y-6">
              {/* Project Card Header */}
              <div className="flex items-start justify-between pb-5 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-md shrink-0 shadow-2xs"
                      style={{ backgroundColor: activeProject.color || '#10b981' }}
                    />
                    <h2 className="font-bold text-slate-900 text-lg leading-tight">
                      {activeProject.name}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStageBadge(activeProject.lifecycle_stage).bg}`}>
                      {getStageBadge(activeProject.lifecycle_stage).label}
                    </span>
                    {activeProject.project_folder && (
                      <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        /{activeProject.project_folder}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onSelectProject(activeProject)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <span>{t('projectsDirectory.goToBoard')}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Progress Bar & KPIs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">{t('projectsDirectory.progressLabel')}</span>
                  <span className="font-extrabold text-emerald-700 font-mono text-sm">
                    {activeProject.progress_percent || 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${activeProject.progress_percent || 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{t('projectsDirectory.statusLabel')}: <strong className="text-slate-700">{activeProject.status}</strong></span>
                  <span><button onClick={() => onEditProject && onEditProject(activeProject)} className="text-emerald-700 font-semibold hover:underline">{t('common.edit')}</button></span>
                </div>
              </div>

              {/* Infrastructure Card (Admin & Manager Only) */}
              {canViewInfrastructure && (activeProject.location_path || activeProject.github_repo || activeProject.server_name) && (
                <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Server className="w-3 h-3 text-emerald-600" />
                      <span>Host & Source Info (Admin)</span>
                    </span>
                    {activeProject.is_restricted ? (
                      <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                        Employee Hidden
                      </span>
                    ) : (
                      <span className="text-[9px] font-medium text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                        Employee Visible
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {activeProject.location_path && (
                      <div className="flex items-start gap-1.5">
                        <HardDrive className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 block font-medium">Situated At:</span>
                          <span className="font-mono text-[11px] text-slate-800 break-all select-all font-semibold">
                            {activeProject.location_path}
                          </span>
                        </div>
                      </div>
                    )}

                    {activeProject.server_name && (
                      <div className="flex items-start gap-1.5 pt-1">
                        <Server className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 block font-medium">Server Runtime:</span>
                          <span className="text-[11px] text-sky-800 font-semibold">
                            {activeProject.server_name}
                          </span>
                        </div>
                      </div>
                    )}

                    {activeProject.github_repo && (
                      <div className="flex items-start gap-1.5 pt-1">
                        <GitBranch className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 block font-medium">GitHub Repository:</span>
                          <a
                            href={activeProject.github_repo.replace('.git', '')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[11px] text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1 break-all"
                          >
                            <span>{activeProject.github_repo}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Technology Stack & Architecture Card */}
              {activeProject.tech && (activeProject.tech.frontend?.length > 0 || activeProject.tech.backend?.length > 0 || activeProject.tech.database?.length > 0 || activeProject.tech.technologies?.length > 0) && (
                <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Cpu className="w-3 h-3 text-emerald-600" />
                      <span>{t('projectsDirectory.techStackTitle') || 'Tech Stack & Architecture'}</span>
                    </span>
                    <span className="text-[9px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-3xs">
                      Stack Specs
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {/* Frontend */}
                    <div className="flex items-start gap-2">
                      <div className="w-16 shrink-0 text-[10px] font-semibold text-slate-400 flex items-center gap-1 pt-0.5">
                        <Code2 className="w-3 h-3 text-sky-500" />
                        <span>Frontend:</span>
                      </div>
                      <div className="flex flex-wrap gap-1 flex-1">
                        {activeProject.tech.frontend?.length > 0 ? (
                          activeProject.tech.frontend.map(f => (
                            <span key={f} className="text-[10px] font-medium text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200/80">
                              {f}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Static UI</span>
                        )}
                      </div>
                    </div>

                    {/* Backend */}
                    <div className="flex items-start gap-2">
                      <div className="w-16 shrink-0 text-[10px] font-semibold text-slate-400 flex items-center gap-1 pt-0.5">
                        <Server className="w-3 h-3 text-emerald-600" />
                        <span>Backend:</span>
                      </div>
                      <div className="flex flex-wrap gap-1 flex-1">
                        {activeProject.tech.backend?.length > 0 ? (
                          activeProject.tech.backend.map(b => (
                            <span key={b} className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80">
                              {b}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">API / Script Runtime</span>
                        )}
                      </div>
                    </div>

                    {/* Database */}
                    <div className="flex items-start gap-2">
                      <div className="w-16 shrink-0 text-[10px] font-semibold text-slate-400 flex items-center gap-1 pt-0.5">
                        <Database className="w-3 h-3 text-indigo-500" />
                        <span>Database:</span>
                      </div>
                      <div className="flex flex-wrap gap-1 flex-1">
                        {activeProject.tech.database?.length > 0 ? (
                          activeProject.tech.database.map(db => (
                            <span key={db} className="text-[10px] font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200/80">
                              {db}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Local Store / File</span>
                        )}
                      </div>
                    </div>

                    {/* Other Tech & Frameworks */}
                    {activeProject.tech.technologies?.length > 0 && (
                      <div className="pt-1 border-t border-slate-100 flex items-start gap-2">
                        <div className="w-16 shrink-0 text-[10px] font-semibold text-slate-400 pt-0.5">
                          <span>Tooling:</span>
                        </div>
                        <div className="flex flex-wrap gap-1 flex-1">
                          {activeProject.tech.technologies.map(t => (
                            <span key={t} className="text-[9px] font-mono text-slate-600 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3 Metrics Cards */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] font-semibold text-slate-500 block">{t('projectsDirectory.totalTasks')}</span>
                  <span className="text-base font-extrabold text-slate-800 block mt-0.5 font-mono">
                    {activeProject.task_count || 0}
                  </span>
                </div>
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
                  <span className="text-[10px] font-semibold text-emerald-800 block">{t('projectsDirectory.completedTasks')}</span>
                  <span className="text-base font-extrabold text-emerald-700 block mt-0.5 font-mono">
                    {activeProject.completed_task_count || 0}
                  </span>
                </div>
                <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-100">
                  <span className="text-[10px] font-semibold text-sky-800 block">{t('projectsDirectory.spentTime')}</span>
                  <span className="text-base font-extrabold text-sky-700 block mt-0.5 font-mono">
                    {activeProject.total_logged_hours || 0}h
                  </span>
                </div>
              </div>

              {/* Issues & Blockers Section */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4 text-amber-600" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {t('projectsDirectory.issuesAndRisks')}
                    </h3>
                  </div>
                  {activeProject.issues && activeProject.issues.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {activeProject.issues.length} {t('projectsDirectory.issuesCount')}
                    </span>
                  )}
                </div>

                {!activeProject.issues || activeProject.issues.length === 0 ? (
                  <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/60 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold text-emerald-900">{t('projectsDirectory.noIssuesTitle')}</p>
                      <p className="text-[11px] text-emerald-700">{t('projectsDirectory.noIssuesDesc')}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeProject.issues.map((issue) => (
                      <div
                        key={issue.id}
                        className="p-3 bg-amber-50/50 hover:bg-amber-50 border border-amber-200/70 rounded-xl space-y-1 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {issue.title}
                          </p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            issue.status === 'Blocked' 
                              ? 'bg-rose-100 text-rose-800' 
                              : issue.priority === 'Urgent'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {issue.status === 'Blocked' ? 'Blocked' : issue.priority}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{t('projectsDirectory.statusLabel')}: <strong className="text-slate-700">{issue.status}</strong></span>
                          {issue.due_date && (
                            <span className="font-mono text-rose-600">
                              Due: {issue.due_date}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Documentation & Overview Link */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onOpenOverview && onOpenOverview(activeProject)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 hover:border-emerald-300 transition-all shadow-xs cursor-pointer group active:scale-[0.98]"
                  title="Open Project Documentation, Blueprints & PDF Guides"
                >
                  <BookOpen className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span>{t('projectsDirectory.viewDocumentation')}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEditProject && onEditProject(activeProject)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer shadow-xs"
                    title="Edit Project Configuration"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t('projectsDirectory.editShortcut')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProjectToDelete(activeProject)}
                    className="inline-flex items-center gap-1 p-2 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer shadow-xs"
                    title="Remove or Hard Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
              <FolderKanban className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs">{t('projectsDirectory.tryAdjusting')}</p>
            </div>
          )}
        </div>
        )}

      </div>

      {/* Remove / Delete Project Modal */}
      {projectToDelete && (
        <DeleteProjectModal
          project={projectToDelete}
          onClose={() => setProjectToDelete(null)}
          onDeleted={(deletedProj, mode) => {
            setProjectToDelete(null);
            if (onRefreshProjects) onRefreshProjects();
          }}
          currentUser={currentUser}
        />
      )}

      {/* Project Sync & Cloud Replication Modal */}
      {showSyncModal && (
        <ProjectSyncModal
          onClose={() => setShowSyncModal(false)}
          onSyncComplete={() => {
            if (onRefreshProjects) onRefreshProjects();
          }}
          totalProjects={projects.length}
        />
      )}
    </div>
  );
}
