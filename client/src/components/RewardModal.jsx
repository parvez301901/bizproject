import React, { useState } from 'react';
import { 
  X, 
  DollarSign, 
  Sparkles, 
  User, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Briefcase
} from 'lucide-react';
import { api } from '../services/api';

export default function RewardModal({
  isOpen,
  onClose,
  users = [],
  projects = [],
  initialUser = null,
  initialTask = null,
  currentUser,
  onRewardSuccess
}) {
  const [selectedUserId, setSelectedUserId] = useState(initialUser?.id || '');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [rewardType, setRewardType] = useState('Task Completion Bonus');
  const [selectedTaskId, setSelectedTaskId] = useState(initialTask?.id || '');
  const [selectedProjectId, setSelectedProjectId] = useState(initialTask?.project_id || '');
  const [notes, setNotes] = useState(
    initialTask?.title ? `Excellent completion on task: "${initialTask.title}"` : ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Keep state synced when modal is re-opened with props
  React.useEffect(() => {
    if (isOpen) {
      if (initialUser?.id) {
        setSelectedUserId(initialUser.id);
      } else if (!selectedUserId && users.length > 0) {
        // default to first non-admin if possible
        const defaultTarget = users.find(u => u.role !== 'admin') || users[0];
        if (defaultTarget) setSelectedUserId(defaultTarget.id);
      }
      if (initialTask?.id) {
        setSelectedTaskId(initialTask.id);
        if (initialTask.project_id) setSelectedProjectId(initialTask.project_id);
        if (!notes) setNotes(`Outstanding performance on task "${initialTask.title}"`);
      }
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, initialUser, initialTask, users]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!selectedUserId) {
      setError('Please select an employee or team member to reward.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please specify a valid positive reward amount.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.createReward({
        user_id: selectedUserId,
        amount: numAmount,
        currency,
        reward_type: rewardType,
        task_id: selectedTaskId || null,
        project_id: selectedProjectId || null,
        notes: notes.trim(),
        actor_name: currentUser?.full_name || 'Admin'
      });

      setSuccessMsg(`Reward of $${numAmount.toFixed(2)} granted successfully!`);
      setTimeout(() => {
        if (onRewardSuccess) onRewardSuccess(res.reward);
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to grant reward. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const recipientUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-emerald-100 text-xs font-semibold mb-2">
            <DollarSign className="w-3.5 h-3.5 text-amber-300" />
            <span>Admin Financial Reward Portal</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Reward Team Member</h2>
          <p className="text-emerald-100/90 text-xs mt-1">
            Reward an employee or team member with financial bonus compensation. Recorded directly into their personal dashboard.
          </p>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Member Selection */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Select Recipient Member <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={loading}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                required
              >
                <option value="">-- Choose team member --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.designation || u.role || 'Member'} - {u.email})
                  </option>
                ))}
              </select>
            </div>
            {recipientUser && (
              <div className="mt-2 flex items-center gap-2.5 px-3 py-2 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                <img
                  src={recipientUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(recipientUser.full_name)}`}
                  alt={recipientUser.full_name}
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-emerald-200"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 truncate">{recipientUser.full_name}</div>
                  <div className="text-[11px] text-emerald-700 truncate">{recipientUser.designation || 'Team Member'} &bull; {recipientUser.department || 'General'}</div>
                </div>
              </div>
            )}
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Reward Amount <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm font-bold text-emerald-700">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="50.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading}
                  className="w-full text-sm font-bold font-mono pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={loading}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="SEK">SEK (kr)</option>
                <option value="GBP">GBP (£)</option>
                <option value="BDT">BDT (৳)</option>
              </select>
            </div>
          </div>

          {/* Preset Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400">Quick amounts:</span>
            {[20, 50, 100, 200, 500].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(val.toString())}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  parseFloat(amount) === val
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                +${val}
              </button>
            ))}
          </div>

          {/* Reward Type / Category */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Reward Category / Type
            </label>
            <select
              value={rewardType}
              onChange={(e) => setRewardType(e.target.value)}
              disabled={loading}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Task Completion Bonus">Task Completion Bonus</option>
              <option value="Project Milestone Bonus">Project Milestone Bonus</option>
              <option value="Excellence & Speed Award">Excellence & Speed Award</option>
              <option value="Quality & Bug Squashing">Quality & Bug Squashing</option>
              <option value="Monthly Outstanding Performer">Monthly Outstanding Performer</option>
              <option value="Discretionary Admin Bonus">Discretionary Admin Bonus</option>
            </select>
          </div>

          {/* Associated Project (Optional) */}
          {projects && projects.length > 0 && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Related Workspace Project <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                disabled={loading}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- No specific project --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes / Reason for reward */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Notes & Recognition Message <span className="text-slate-400 font-normal">(Visible on their statement)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Completed high-priority client module ahead of schedule with zero errors!"
              disabled={loading}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !amount || !selectedUserId}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4 text-amber-300" />
              <span>{loading ? 'Processing...' : `Grant $${amount ? parseFloat(amount).toFixed(2) : '0.00'} Reward`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
