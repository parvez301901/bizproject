import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Calendar, 
  Clock, 
  User, 
  Trophy, 
  Sparkles, 
  Check, 
  AlertCircle,
  ListTree
} from 'lucide-react';

export default function CreateTaskModal({
  isOpen,
  onClose,
  onCreateTask,
  users = [],
  tasks = [],
  currentBoard
}) {
  const [title, setTitle] = useState('');
  const [parentTaskId, setParentTaskId] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [estHours, setEstHours] = useState(2);
  const [assignees, setAssignees] = useState([]);
  const [xpReward, setXpReward] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const toggleAssignee = (userId) => {
    setAssignees(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a task title.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onCreateTask({
        title: title.trim(),
        parent_id: parentTaskId || null,
        description: description.trim(),
        priority,
        due_date: dueDate || null,
        estimated_hours: Number(estHours) || 0,
        assignee_ids: assignees,
        xp_reward: Number(xpReward) || 50,
        status: 'To Do'
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-emerald-100 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Task Creation & Member XP Assignment</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Create Task & Assign XP</h2>
          <p className="text-emerald-100/90 text-xs mt-1">
            Create an executable task, assign member(s), and set completion gamification XP.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement authentication middleware & 2FA"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-emerald-500 focus:bg-white"
            />
          </div>

          {/* Optional Parent Task (Subtask designation) */}
          {tasks.filter(t => !t.parent_id).length > 0 && (
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                <ListTree className="w-3.5 h-3.5 text-slate-500" />
                <span>Parent Task (Optional - Make this a Subtask)</span>
              </label>
              <select
                value={parentTaskId}
                onChange={(e) => setParentTaskId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-emerald-500 focus:bg-white cursor-pointer"
              >
                <option value="">None (Standard Top-level Task)</option>
                {tasks.filter(t => !t.parent_id).map(t => (
                  <option key={t.id} value={t.id}>
                    ↳ Subtask of: {t.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Description / Acceptance Criteria</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide actionable specifications and deliverables..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-emerald-500 focus:bg-white resize-y"
            />
          </div>

          {/* XP Points Reward (Admin assign XP) */}
          <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-600 fill-amber-500" />
                <span>Task XP Points Reward</span>
              </label>
              <span className="text-[11px] font-semibold text-amber-800">
                Awarded upon task completion
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <div className="relative w-32">
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={xpReward}
                  onChange={(e) => setXpReward(e.target.value)}
                  className="w-full text-xs font-mono font-bold bg-white border border-amber-300 rounded-xl pl-3 pr-8 py-2 text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                <span className="absolute right-2.5 top-2 text-[11px] font-bold text-amber-600">XP</span>
              </div>

              {/* Quick XP Preset Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[25, 50, 100, 150, 250].map((pts) => (
                  <button
                    key={pts}
                    type="button"
                    onClick={() => setXpReward(pts)}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      Number(xpReward) === pts
                        ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                        : 'bg-white hover:bg-amber-100 text-amber-900 border-amber-200'
                    }`}
                  >
                    +{pts} XP
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Member Assignees Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">Assign Member(s)</label>
              <span className="text-[11px] text-slate-400">
                {assignees.length} selected
              </span>
            </div>

            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1.5 bg-slate-50/70 border border-slate-200 rounded-xl">
              {users.map(u => {
                const isSelected = assignees.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleAssignee(u.id)}
                    className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs font-semibold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                    }`}
                  >
                    <img
                      src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.full_name)}`}
                      alt=""
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span>{u.full_name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid: Priority, Due Date, Est. Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-emerald-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Est. Hours</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={estHours}
                onChange={(e) => setEstHours(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-900/10 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
