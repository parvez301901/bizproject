import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  User, 
  Briefcase, 
  TrendingUp, 
  Award, 
  Filter, 
  ArrowUpRight,
  Search,
  Sparkles,
  ChevronRight,
  CalendarDays,
  Flame,
  Check,
  X,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../LanguageContext';

export default function WorkReportView({ users = [], projects = [], onOpenLogWork }) {
  const { t } = useLanguage();
  const [timeframe, setTimeframe] = useState('week'); // 'day', 'week', 'month', 'all'
  const [selectedUserId, setSelectedUserId] = useState('all');
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeEmployeeDetail, setActiveEmployeeDetail] = useState(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await api.getProductivityReport({
        timeframe,
        user_id: selectedUserId,
        project_id: selectedProjectId
      });
      setReportData(data);
      if (data.employeeReports && data.employeeReports.length > 0) {
        if (!activeEmployeeDetail) {
          setActiveEmployeeDetail(data.employeeReports[0]);
        } else {
          const fresh = data.employeeReports.find(e => e.user.id === activeEmployeeDetail.user.id);
          setActiveEmployeeDetail(fresh || data.employeeReports[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [timeframe, selectedUserId, selectedProjectId]);

  const filteredEmployees = (reportData?.employeeReports || []).filter(item => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const name = (item.user.full_name || '').toLowerCase();
    const email = (item.user.email || '').toLowerCase();
    const dept = (item.user.department || '').toLowerCase();
    const designation = (item.user.designation || '').toLowerCase();
    return name.includes(term) || email.includes(term) || dept.includes(term) || designation.includes(term);
  });

  // When search filter changes, keep activeEmployeeDetail pointing to a visible employee
  useEffect(() => {
    if (filteredEmployees.length > 0) {
      const exists = filteredEmployees.some(e => e.user.id === activeEmployeeDetail?.user?.id);
      if (!exists) {
        setActiveEmployeeDetail(filteredEmployees[0]);
      }
    } else {
      setActiveEmployeeDetail(null);
    }
  }, [searchTerm, reportData]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Page Title & Timeframe Selector Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/80">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('reports.badge')}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('reports.title')}
          </h1>
          <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
            {t('reports.subtitle')}
          </p>
        </div>

        {/* Timeframe Controls (Day / Week / Month / All) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setTimeframe('day')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                timeframe === 'day'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('common.daily')}</span>
            </button>

            <button
              onClick={() => setTimeframe('week')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                timeframe === 'week'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('common.weekly')}</span>
            </button>

            <button
              onClick={() => setTimeframe('month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                timeframe === 'month'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('common.monthly')}</span>
            </button>

            <button
              onClick={() => setTimeframe('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                timeframe === 'all'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{t('common.allTime')}</span>
            </button>
          </div>

          {/* Employee Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:border-emerald-500 shadow-2xs pr-8"
            >
              <option value="all">👥 {t('common.allTeam')}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.designation || u.role || 'Member'})
                </option>
              ))}
            </select>
          </div>

          {/* Project Filter */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:border-emerald-500 shadow-2xs"
          >
            <option value="all">📁 {t('common.allProjects')}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Log Work Time Action Button */}
          {onOpenLogWork && (
            <button
              onClick={onOpenLogWork}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{t('sidebar.logWorkTime')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      {reportData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">{t('reports.kpiActiveTeam')}</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                {reportData.summary.totalEmployees}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Workspace Team</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">{t('reports.kpiCompletedTasks')} ({timeframe.toUpperCase()})</p>
              <h3 className="text-2xl font-extrabold text-emerald-700 mt-1">
                {reportData.summary.totalTasksCompleted}
              </h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                {reportData.summary.overallCompletionRate}% {t('reports.kpiCompletionRate')}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">{t('reports.kpiLoggedHours')}</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                {reportData.summary.totalLoggedHours} {t('reports.hrs')}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Logged Work Hours</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">{t('reports.kpiWorkload')}</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                {reportData.summary.totalTasksAssigned}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Active Assignment Total</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Split: Employee Performance Table vs Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* Left Column: Full Employee Leaderboard & Summary (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          {/* Table Header & Search */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {t('reports.breakdownTitle')} ({timeframe === 'day' ? 'Today' : timeframe === 'week' ? 'This Week' : timeframe === 'month' ? 'This Month' : 'All Time'})
              </h2>
              <p className="text-xs text-slate-500">{t('reports.clickToInspect')}</p>
            </div>

            {/* Interactive Employee Search Bar */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t('reports.searchEmployee')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-8 py-2 text-xs bg-slate-50 border border-slate-200/90 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 w-64 transition-all shadow-2xs font-medium text-slate-800"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {searchTerm && (
                <span className="text-[11px] font-semibold px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                  {filteredEmployees.length} {t('reports.foundCount')}
                </span>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">{t('reports.colEmployee')}</th>
                  <th className="py-3 px-4 text-center">{t('reports.colCompleted')}</th>
                  <th className="py-3 px-4 text-center">{t('reports.colInProgress')}</th>
                  <th className="py-3 px-4 text-center">{t('reports.colRate')}</th>
                  <th className="py-3 px-4 text-center">{t('reports.colHours')}</th>
                  <th className="py-3 px-4 text-right">{t('reports.colXp')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      {t('reports.generating')}
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700 text-sm">
                        {t('reports.noEmployeeFound')} "{searchTerm}"
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {t('reports.checkSpelling')}
                      </p>
                      <button
                        onClick={() => setSearchTerm('')}
                        className="mt-3 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        {t('reports.viewAllEmployees')}
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((report) => {
                    const isSelected = activeEmployeeDetail?.user.id === report.user.id;
                    return (
                      <tr 
                        key={report.user.id}
                        onClick={() => setActiveEmployeeDetail(report)}
                        className={`hover:bg-emerald-50/40 cursor-pointer transition-colors ${
                          isSelected ? 'bg-emerald-50/70 border-l-4 border-l-emerald-600' : ''
                        }`}
                      >
                        {/* Employee Bio */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={report.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(report.user.full_name)}`}
                              alt={report.user.full_name}
                              className="w-9 h-9 rounded-full ring-2 ring-emerald-400/20 object-cover shrink-0"
                            />
                            <div>
                              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                                <span>{report.user.full_name}</span>
                                {report.completedTasksCount > 3 && (
                                  <Flame className="w-3.5 h-3.5 text-amber-500" title="High Performer" />
                                )}
                              </p>
                              <span className="text-[11px] text-slate-400 block">
                                {report.user.designation || 'Team Member'} • {report.user.department || 'Operations'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Completed Count */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center justify-center font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs">
                            {report.completedTasksCount}
                          </span>
                        </td>

                        {/* In Progress Count */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center justify-center font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs">
                            {report.inProgressTasksCount}
                          </span>
                        </td>

                        {/* Progress Bar & % */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="w-24 mx-auto space-y-1">
                            <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                              <span>{report.completionRate}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-emerald-600 h-full rounded-full"
                                style={{ width: `${report.completionRate}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Logged Hours */}
                        <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-700">
                          {report.actualHours} {t('reports.hrs')}
                        </td>

                        {/* Level & XP */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                              Lvl {report.user.level || 1}
                            </span>
                            <span className="font-mono text-emerald-700 font-bold text-xs">
                              {report.user.xp || 0} XP
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Detailed Drilldown of Selected Employee (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {activeEmployeeDetail ? (
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 space-y-6">
              {/* Profile Card */}
              <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
                <img
                  src={activeEmployeeDetail.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(activeEmployeeDetail.user.full_name)}`}
                  alt={activeEmployeeDetail.user.full_name}
                  className="w-14 h-14 rounded-2xl ring-2 ring-emerald-500/20 object-cover shrink-0"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {activeEmployeeDetail.user.full_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeEmployeeDetail.user.designation || 'Team Member'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {activeEmployeeDetail.user.email}
                  </p>
                </div>
              </div>

              {/* Timeframe Highlights */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                  <span className="text-[11px] font-semibold text-emerald-800 block">{t('reports.colCompleted')}</span>
                  <span className="text-xl font-extrabold text-emerald-700 mt-0.5 block">
                    {activeEmployeeDetail.completedTasksCount}
                  </span>
                  <span className="text-[10px] text-emerald-600">
                    {timeframe.toUpperCase()} Window
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="text-[11px] font-semibold text-slate-600 block">{t('reports.colHours')}</span>
                  <span className="text-xl font-extrabold text-slate-800 mt-0.5 block font-mono">
                    {activeEmployeeDetail.actualHours} hrs
                  </span>
                  <span className="text-[10px] text-slate-400">Actual Spent</span>
                </div>
              </div>

              {/* Completed Tasks List in this Timeframe */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {t('reports.tasksCompletedDetails')} ({activeEmployeeDetail.completedTasksList.length})
                  </h4>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                    {timeframe}
                  </span>
                </div>

                {activeEmployeeDetail.completedTasksList.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-400">
                      {t('reports.noCompletedTasksInWindow')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {activeEmployeeDetail.completedTasksList.map((task) => (
                      <div 
                        key={task.id}
                        className="p-3 bg-slate-50/80 hover:bg-emerald-50/30 border border-slate-200/70 rounded-xl transition-colors space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-800 line-clamp-1">
                            {task.title}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded shrink-0">
                            Done
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <span 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: task.project_color || '#10b981' }} 
                            />
                            <span className="truncate max-w-[130px]">{task.project_name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {task.completed_at ? task.completed_at.substring(0, 10) : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
              <User className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs">{t('reports.selectToInspect')}</p>
            </div>
          )}

          {/* Gamification Progress Milestone */}
          {activeEmployeeDetail && (
            <div className="bg-gradient-to-br from-emerald-800 to-teal-900 rounded-2xl p-5 text-white shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-300" />
                  <span className="font-bold text-xs uppercase tracking-wider text-emerald-200">{t('reports.gamificationRank')}</span>
                </div>
                <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full">
                  Level {activeEmployeeDetail.user.level || 1}
                </span>
              </div>
              <p className="text-xs text-emerald-100 leading-relaxed">
                {t('reports.xpEarnedSummary', {
                  xp: activeEmployeeDetail.user.xp || 0,
                  needed: 100 - ((activeEmployeeDetail.user.xp || 0) % 100)
                })}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
