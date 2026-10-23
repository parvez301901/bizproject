import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Tag, 
  LayoutList, 
  Kanban as KanbanIcon, 
  ArrowUpDown, 
  FolderKanban, 
  RefreshCw,
  MoreHorizontal,
  Trash2,
  Edit2,
  ExternalLink,
  Check,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import KanbanBoard from './KanbanBoard';

const STATUS_CONFIG = {
  'Backlog': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  'To Do': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'In Progress': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'In Review': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Done': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  'Blocked': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' }
};

const PRIORITY_CONFIG = {
  'Low': { color: 'text-slate-600', bg: 'bg-slate-100' },
  'Medium': { color: 'text-emerald-700', bg: 'bg-emerald-50' },
  'High': { color: 'text-amber-700', bg: 'bg-amber-50' },
  'Urgent': { color: 'text-rose-700', bg: 'bg-rose-50' }
};

export default function TasksView({
  currentUser,
  users = [],
  projects = [],
  onOpenTaskModal,
  onOpenCreateTaskModal,
  onSelectProject
}) {
  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const isManagement = isAdmin || isManager;

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'kanban'

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState(() => {
    // Regular team members default to seeing their own tasks, but can see others if selected
    return isManagement ? 'All' : (currentUser?.id || 'All');
  });

  // Load all tasks from API
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getTasks();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Quick inline status update
  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await api.updateTask(taskId, {
        status: newStatus,
        actor_name: currentUser?.full_name || 'Admin'
      });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error('Failed to update task status:', err);
      alert(err.message || 'Failed to update status');
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = (t.title || '').toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      const matchProject = (t.project_name || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchProject) return false;
    }
    if (statusFilter !== 'All' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;
    if (projectFilter !== 'All' && t.project_id !== projectFilter) return false;
    if (assigneeFilter !== 'All') {
      const assignees = Array.isArray(t.assignee_ids) ? t.assignee_ids : [];
      if (!assignees.includes(assigneeFilter) && t.created_by !== assigneeFilter) return false;
    }
    return true;
  });

  // Calculate task summary metrics
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(t => t.status === 'Done').length;
  const inProgressTasks = filteredTasks.filter(t => t.status === 'In Progress').length;
  const urgentTasks = filteredTasks.filter(t => t.priority === 'Urgent' || t.status === 'Blocked').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 animate-fadeIn select-none">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-900/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-emerald-100 text-xs font-semibold">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{isManagement ? 'Enterprise Task Operations' : 'My Assigned Workload'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {isManagement ? 'Master Tasks Workspace' : 'My Daily Tasks & Deliverables'}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
            {isManagement 
              ? 'Real-time overview of all project deliverables, assigned member workloads, milestones, and active execution stages across the entire workspace.'
              : 'Track and manage your assigned tasks, monitor deadlines, update progress stages, and complete deliverables.'}
          </p>
        </div>

        {/* Action Button & Metric Pill */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={fetchTasks}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs border border-white/20 transition-all cursor-pointer"
            title="Refresh Tasks"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => onOpenCreateTaskModal && onOpenCreateTaskModal()}
            className="px-4 py-2.5 rounded-2xl bg-white text-emerald-800 font-bold text-xs sm:text-sm shadow-md hover:bg-emerald-50 transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create New Task</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Tasks</div>
          <div className="text-2xl font-extrabold text-slate-800">{totalTasks}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across filtered projects</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Completed (Done)</div>
          <div className="text-2xl font-extrabold text-emerald-600">{completedTasks}</div>
          <div className="text-[11px] text-emerald-700/80 font-semibold mt-0.5">{completionRate}% completion rate</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-teal-600 uppercase tracking-wider mb-1">In Progress</div>
          <div className="text-2xl font-extrabold text-teal-700">{inProgressTasks}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Currently active work</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-rose-500 uppercase tracking-wider mb-1">Blockers & Urgent</div>
          <div className="text-2xl font-extrabold text-rose-600">{urgentTasks}</div>
          <div className="text-[11px] text-rose-600/80 font-semibold mt-0.5">Immediate attention</div>
        </div>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, description or project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* View Mode Toggle (Table / Board) */}
          <div className="flex items-center gap-2">
            <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'table'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'kanban'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <KanbanIcon className="w-3.5 h-3.5" />
                <span>Kanban Board</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1 text-slate-400 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Project Filter */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium cursor-pointer focus:outline-none focus:border-emerald-500"
          >
            <option value="All">All Projects ({projects.length})</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium cursor-pointer focus:outline-none focus:border-emerald-500"
          >
            <option value="All">All Statuses</option>
            <option value="Backlog">Backlog</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="In Review">In Review</option>
            <option value="Done">Done</option>
            <option value="Blocked">Blocked</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium cursor-pointer focus:outline-none focus:border-emerald-500"
          >
            <option value="All">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>

          {/* Assignee Filter */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium cursor-pointer focus:outline-none focus:border-emerald-500"
          >
            <option value="All">{isManagement ? 'All Assignees' : 'All Team'}</option>
            {currentUser && (
              <option value={currentUser.id}>Assigned to Me ({currentUser.full_name})</option>
            )}
            {users.filter(u => u.id !== currentUser?.id).map(u => (
              <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
            ))}
          </select>

          {(search || statusFilter !== 'All' || priorityFilter !== 'All' || projectFilter !== 'All' || (isManagement && assigneeFilter !== 'All')) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('All');
                setPriorityFilter('All');
                setProjectFilter('All');
                setAssigneeFilter(isManagement ? 'All' : (currentUser?.id || 'All'));
              }}
              className="text-slate-500 hover:text-rose-600 underline text-xs font-semibold ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Table or Kanban */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-2xs">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Loading workspace tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Tasks Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search || statusFilter !== 'All' || priorityFilter !== 'All'
              ? 'Try adjusting your search criteria or resetting the applied filters.'
              : 'There are no active tasks registered in the workspace yet.'}
          </p>
          <button
            type="button"
            onClick={() => onOpenCreateTaskModal && onOpenCreateTaskModal()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Task</span>
          </button>
        </div>
      ) : viewMode === 'kanban' ? (
        <KanbanBoard
          tasks={filteredTasks}
          users={users}
          onUpdateTask={async (taskId, updates) => {
            try {
              await api.updateTask(taskId, updates);
              setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
            } catch (err) {
              alert(err.message || 'Failed to update task');
            }
          }}
          onOpenTaskModal={(task) => onOpenTaskModal && onOpenTaskModal(task)}
          onAddTask={() => onOpenCreateTaskModal && onOpenCreateTaskModal()}
        />
      ) : (
        /* Standard Table View */
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4 min-w-[240px]">Task Title</th>
                  <th className="py-3 px-4 min-w-[150px]">Project</th>
                  <th className="py-3 px-4 min-w-[130px]">Status</th>
                  <th className="py-3 px-4 min-w-[100px]">Priority</th>
                  <th className="py-3 px-4 min-w-[140px]">Assignees</th>
                  <th className="py-3 px-4 min-w-[110px]">Due Date</th>
                  <th className="py-3 px-4 text-center min-w-[80px]">Est. Hrs</th>
                  <th className="py-3 px-4 text-center min-w-[80px]">XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task, idx) => {
                  const statusConf = STATUS_CONFIG[task.status] || STATUS_CONFIG['To Do'];
                  const priorityConf = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG['Medium'];
                  const assignedUsers = (task.assignee_ids || []).map(id => users.find(u => u.id === id)).filter(Boolean);

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => onOpenTaskModal && onOpenTaskModal(task)}
                    >
                      {/* Index */}
                      <td className="py-3 px-4 text-center font-mono text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Title & Description */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-2">
                          <span>{task.title}</span>
                          {task.parent_id && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                              Subtask
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {task.description}
                          </p>
                        )}
                      </td>

                      {/* Project Name Badge */}
                      <td className="py-3 px-4">
                        {task.project_name ? (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectProject) {
                                const found = projects.find(p => p.id === task.project_id);
                                if (found) onSelectProject(found);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 transition-all cursor-pointer"
                          >
                            <span 
                              className="w-2 h-2 rounded-full shrink-0" 
                              style={{ backgroundColor: task.project_color || '#10b981' }} 
                            />
                            <span className="truncate max-w-[130px]">{task.project_name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No Project</span>
                        )}
                      </td>

                      {/* Status Selector */}
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <select
                            value={task.status}
                            onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer appearance-none pr-6 focus:outline-none transition-all ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}
                          >
                            <option value="Backlog">Backlog</option>
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="In Review">In Review</option>
                            <option value="Done">Done</option>
                            <option value="Blocked">Blocked</option>
                          </select>
                          <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${priorityConf.bg} ${priorityConf.color}`}>
                          {task.priority || 'Medium'}
                        </span>
                      </td>

                      {/* Assignees */}
                      <td className="py-3 px-4">
                        {assignedUsers.length > 0 ? (
                          <div className="flex items-center -space-x-1.5 overflow-hidden">
                            {assignedUsers.map(u => (
                              <div
                                key={u.id}
                                title={`${u.full_name} (${u.role})`}
                                className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white overflow-hidden shadow-2xs"
                              >
                                {u.avatar_url ? (
                                  <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  (u.full_name || 'U').charAt(0).toUpperCase()
                                )}
                              </div>
                            ))}
                            {assignedUsers.length > 3 && (
                              <span className="text-[10px] font-semibold text-slate-500 pl-2">
                                +{assignedUsers.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Unassigned</span>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {task.due_date ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{task.due_date}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Estimated Hours */}
                      <td className="py-3 px-4 text-center font-mono text-slate-600 text-[11px]">
                        {task.estimated_hours ? `${task.estimated_hours}h` : '—'}
                      </td>

                      {/* XP Reward */}
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded-full">
                          +{task.xp_reward || 50} XP
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Pagination / Count Info */}
          <div className="p-3 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
            <span>Showing <b>{filteredTasks.length}</b> tasks</span>
            <span className="text-[11px]">Click on any row to view comments, subtasks, and log time.</span>
          </div>
        </div>
      )}
    </div>
  );
}
