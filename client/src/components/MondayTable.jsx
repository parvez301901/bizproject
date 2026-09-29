import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  User, 
  Tag, 
  ArrowUpDown, 
  Search,
  Filter,
  CheckSquare,
  Square,
  MoreHorizontal
} from 'lucide-react';

const STATUS_CONFIG = {
  'Backlog': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  'To Do': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'In Progress': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'In Review': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Done': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  'Blocked': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' }
};

const PRIORITY_CONFIG = {
  'Low': { color: 'text-slate-500', bg: 'bg-slate-100' },
  'Medium': { color: 'text-emerald-700', bg: 'bg-emerald-50' },
  'High': { color: 'text-amber-700', bg: 'bg-amber-50' },
  'Urgent': { color: 'text-rose-700', bg: 'bg-rose-50' }
};

export default function MondayTable({
  tasks = [],
  users = [],
  onUpdateTask,
  onDeleteTask,
  onBulkUpdate,
  onOpenTaskModal,
  onAddTask
}) {
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [newRowTitle, setNewRowTitle] = useState('');

  const statuses = ['All', 'Backlog', 'To Do', 'In Progress', 'In Review', 'Done', 'Blocked'];
  const priorities = ['All', 'Low', 'Medium', 'High', 'Urgent'];

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    const matchesPriority = filterPriority === 'All' || t.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const toggleSelectAll = () => {
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map(t => t.id));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedTaskIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (!newRowTitle.trim()) return;
    onAddTask({
      title: newRowTitle.trim(),
      status: 'To Do',
      priority: 'Medium',
      estimated_hours: 2,
    });
    setNewRowTitle('');
  };

  return (
    <div className="space-y-4">
      {/* Table Toolbar & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search tasks in this board..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 focus:outline-none focus:border-emerald-500"
          >
            {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
          </select>

          {/* Filter Priority */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 focus:outline-none focus:border-emerald-500"
          >
            {priorities.map(p => <option key={p} value={p}>{p === 'All' ? 'All Priorities' : p}</option>)}
          </select>
        </div>

        {/* Bulk Action Controls */}
        {selectedTaskIds.length > 0 && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg animate-fadeIn">
            <span className="text-xs font-semibold text-emerald-800">
              {selectedTaskIds.length} Selected
            </span>
            <button
              onClick={() => onBulkUpdate(selectedTaskIds, 'set_status', 'Done')}
              className="text-xs bg-white text-emerald-700 hover:bg-emerald-600 hover:text-white px-2.5 py-1 rounded border border-emerald-300 font-medium transition-colors"
            >
              Mark Done
            </button>
            <button
              onClick={() => onBulkUpdate(selectedTaskIds, 'delete')}
              className="text-xs bg-white text-rose-600 hover:bg-rose-600 hover:text-white px-2.5 py-1 rounded border border-rose-200 font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Spreadsheet / Monday.com Grid */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="w-10 px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedTaskIds.length > 0 && selectedTaskIds.length === filteredTasks.length}
                    onChange={toggleSelectAll}
                    className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 min-w-[260px]">Task Name</th>
                <th className="px-3 py-3 w-36">Status</th>
                <th className="px-3 py-3 w-32">Priority</th>
                <th className="px-3 py-3 w-40">Assignees</th>
                <th className="px-3 py-3 w-32">Due Date</th>
                <th className="px-3 py-3 w-24 text-right">Est. Hours</th>
                <th className="px-3 py-3 w-16 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    No tasks match the filter criteria. Add a new task below.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const statusStyle = STATUS_CONFIG[task.status] || STATUS_CONFIG['To Do'];
                  const priorityStyle = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG['Medium'];
                  const isChecked = selectedTaskIds.includes(task.id);

                  return (
                    <tr 
                      key={task.id} 
                      className={`hover:bg-slate-50/70 transition-colors group ${isChecked ? 'bg-emerald-50/30' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectRow(task.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      {/* Title (Inline editable on blur or click detail) */}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <input
                              type="text"
                              defaultValue={task.title}
                              onBlur={(e) => {
                                if (e.target.value !== task.title && e.target.value.trim()) {
                                  onUpdateTask(task.id, { title: e.target.value.trim() });
                                }
                              }}
                              className="w-full bg-transparent font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400 px-1.5 py-0.5 rounded cursor-text"
                            />
                            <span 
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 bg-amber-50 text-amber-700 border border-amber-200/80"
                              title="Completion Reward"
                            >
                              +{task.xp_reward || 50} XP
                            </span>
                          </div>
                          <button
                            onClick={() => onOpenTaskModal(task)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-emerald-600 p-1 transition-opacity shrink-0"
                            title="Inspect details & comments"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Status Dropdown Pill */}
                      <td className="px-3 py-2.5">
                        <select
                          value={task.status}
                          onChange={(e) => onUpdateTask(task.id, { status: e.target.value })}
                          className={`w-full py-1 px-2.5 rounded-md font-semibold border text-center cursor-pointer transition-all ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                        >
                          {['Backlog', 'To Do', 'In Progress', 'In Review', 'Done', 'Blocked'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>

                      {/* Priority Pill */}
                      <td className="px-3 py-2.5">
                        <select
                          value={task.priority}
                          onChange={(e) => onUpdateTask(task.id, { priority: e.target.value })}
                          className={`w-full py-1 px-2 rounded-md font-semibold text-center cursor-pointer border border-transparent hover:border-slate-200 ${priorityStyle.bg} ${priorityStyle.color}`}
                        >
                          {['Low', 'Medium', 'High', 'Urgent'].map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </td>

                      {/* Assignees Avatars */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center -space-x-1.5 overflow-hidden">
                          {task.assignee_ids && task.assignee_ids.length > 0 ? (
                            task.assignee_ids.map(uid => {
                              const user = users.find(u => u.id === uid);
                              return (
                                <img
                                  key={uid}
                                  src={user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`}
                                  title={user?.full_name || 'Assignee'}
                                  alt=""
                                  className="w-6 h-6 rounded-full border border-white object-cover"
                                />
                              );
                            })
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                          )}
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="px-3 py-2.5">
                        <input
                          type="date"
                          defaultValue={task.due_date || ''}
                          onChange={(e) => onUpdateTask(task.id, { due_date: e.target.value })}
                          className="bg-transparent text-slate-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400 px-1 py-0.5 rounded cursor-pointer text-xs"
                        />
                      </td>

                      {/* Est. Hours */}
                      <td className="px-3 py-2.5 text-right font-mono text-slate-600">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          defaultValue={task.estimated_hours || 0}
                          onBlur={(e) => onUpdateTask(task.id, { estimated_hours: Number(e.target.value) || 0 })}
                          className="w-16 text-right bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400 px-1 py-0.5 rounded font-mono"
                        />
                        <span className="text-slate-400 ml-1">h</span>
                      </td>

                      {/* Delete Action */}
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="text-slate-300 hover:text-rose-600 p-1 rounded transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}

              {/* Quick Inline Add Row (Monday.com style) */}
              <tr className="bg-slate-50/40">
                <td className="px-3 py-3 text-center">
                  <Plus className="w-4 h-4 text-emerald-600 mx-auto" />
                </td>
                <td colSpan={7} className="px-4 py-2">
                  <form onSubmit={handleQuickAdd} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="+ Add a new item / task (press Enter to save)..."
                      value={newRowTitle}
                      onChange={(e) => setNewRowTitle(e.target.value)}
                      className="w-full bg-white border border-slate-200/80 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-xs focus:outline-none transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="submit"
                      disabled={!newRowTitle.trim()}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </form>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
