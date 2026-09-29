import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  ShieldCheck, 
  RefreshCw,
  FolderKanban,
  CheckCircle2,
  Clock,
  LogIn,
  Edit,
  Trash2,
  CheckSquare
} from 'lucide-react';
import { api } from '../services/api';

const ACTION_CONFIG = {
  'USER_REGISTER': { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: User },
  'USER_LOGIN': { bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: LogIn },
  'OAUTH_REGISTER': { bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: ShieldCheck },
  'OAUTH_LOGIN': { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: LogIn },
  'TASK_CREATED': { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckSquare },
  'TASK_UPDATED': { bg: 'bg-amber-50 text-amber-800 border-amber-200', icon: Edit },
  'TASK_DELETED': { bg: 'bg-rose-50 text-rose-800 border-rose-200', icon: Trash2 },
  'TASK_BULK_UPDATE': { bg: 'bg-amber-100 text-amber-900 border-amber-300', icon: Edit },
  'TASK_BULK_DELETE': { bg: 'bg-rose-100 text-rose-900 border-rose-300', icon: Trash2 },
  'PROJECT_CREATED': { bg: 'bg-teal-50 text-teal-800 border-teal-200', icon: FolderKanban },
  'EMPLOYEE_ONBOARDED': { bg: 'bg-emerald-100 text-emerald-900 border-emerald-300', icon: ShieldCheck },
  'CHECKLIST_TOGGLED': { bg: 'bg-blue-50 text-blue-800 border-blue-200', icon: CheckCircle2 },
  'COMMENT_ADDED': { bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock }
};

export default function AuditLogView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getLogs({
        entity_type: entityFilter,
        search: search.trim()
      });
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-1">
            <History className="w-3.5 h-3.5 text-emerald-600" />
            <span>Universal Audit Telemetry</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Audit & Change Trail</h1>
          <p className="text-xs text-slate-500">
            Immutable log of all user registrations, social logins, task mutations, and onboarding actions.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit Stream</span>
        </button>
      </div>

      {/* Toolbar / Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search changes, actors, or task IDs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
          />
        </form>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Filter Category:</span>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Events</option>
            <option value="auth">Auth & Logins</option>
            <option value="task">Tasks & Status</option>
            <option value="onboarding">Employee Onboarding</option>
            <option value="project">Projects</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table / Stream */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3 w-40">Timestamp</th>
                <th className="px-4 py-3 w-44">Action Event</th>
                <th className="px-4 py-3 w-40">Actor</th>
                <th className="px-4 py-3 min-w-[320px]">Change Description & Telemetry</th>
                <th className="px-4 py-3 w-28 text-right">Entity Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No activity logs recorded for this filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const actionStyle = ACTION_CONFIG[log.action] || {
                    bg: 'bg-slate-100 text-slate-700 border-slate-200',
                    icon: History
                  };
                  const IconComponent = actionStyle.icon;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Timestamp */}
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                        {log.created_at}
                      </td>

                      {/* Action Event Badge */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${actionStyle.bg}`}>
                          <IconComponent className="w-3 h-3" />
                          <span>{log.action}</span>
                        </span>
                      </td>

                      {/* Actor */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(log.user_name || 'System')}`}
                            alt=""
                            className="w-5 h-5 rounded-full border border-slate-200 object-cover"
                          />
                          <span className="font-semibold text-slate-800 truncate">{log.user_name || 'System'}</span>
                        </div>
                      </td>

                      {/* Details / Change Diff */}
                      <td className="px-4 py-3 text-slate-700 font-medium">
                        {log.details}
                      </td>

                      {/* Entity Type */}
                      <td className="px-4 py-3 text-right">
                        <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono uppercase">
                          {log.entity_type}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
