import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Award, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  ArrowUpRight, 
  Sparkles, 
  CheckCircle2, 
  FolderKanban, 
  User, 
  Download,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { api } from '../services/api';

export default function EarningsView({
  currentUser,
  users = [],
  projects = [],
  onOpenRewardModal
}) {
  const [rewards, setRewards] = useState([]);
  const [summary, setSummary] = useState({ totalEarnings: 0, rewardCount: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const isManagement = isAdmin || isManager;

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (!isManagement) {
        // Employees always see their own
        params.user_id = currentUser?.id;
      } else if (selectedUserFilter !== 'all') {
        params.user_id = selectedUserFilter;
      }
      const data = await api.getRewards(params);
      setRewards(data?.rewards || []);
      setSummary(data?.summary || { totalEarnings: 0, rewardCount: 0 });
    } catch (err) {
      console.error('Error fetching earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarningsData();
  }, [currentUser?.id, selectedUserFilter, isManagement]);

  const handleDeleteReward = async (rewardId) => {
    if (!window.confirm('Are you sure you want to delete this reward payout entry? This will update the balance immediately.')) {
      return;
    }
    try {
      setDeletingId(rewardId);
      await api.deleteReward(rewardId, currentUser?.full_name || 'Admin');
      await fetchEarningsData();
    } catch (err) {
      alert(err.message || 'Failed to delete reward');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter rewards
  const filteredRewards = rewards.filter((r) => {
    const matchesSearch = 
      (r.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.task_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.project_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.reward_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedTypeFilter === 'all' || r.reward_type === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  // Calculate dynamic stats from filtered/visible
  const visibleTotal = filteredRewards.reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);

  // Format currency
  const formatMoney = (val, cur = 'USD') => {
    const sym = cur === 'EUR' ? '€' : cur === 'SEK' ? 'kr ' : cur === 'GBP' ? '£' : '$';
    return `${sym}${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Export CSV statement
  const exportStatementCSV = () => {
    if (!filteredRewards.length) return;
    const headers = ['Date', 'Recipient', 'Role/Designation', 'Amount', 'Currency', 'Type', 'Task', 'Project', 'Awarded By', 'Notes'];
    const rows = filteredRewards.map(r => [
      `"${r.created_at || ''}"`,
      `"${r.user_name || ''}"`,
      `"${r.user_designation || ''}"`,
      r.amount || 0,
      `"${r.currency || 'USD'}"`,
      `"${r.reward_type || ''}"`,
      `"${(r.task_title || '').replace(/"/g, '""')}"`,
      `"${(r.project_name || '').replace(/"/g, '""')}"`,
      `"${r.awarded_by || ''}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Earnings_Statement_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-emerald-100 text-xs font-semibold mb-2">
              <DollarSign className="w-3.5 h-3.5 text-amber-300" />
              <span>{isManagement ? 'Company Payouts & Compensation' : 'My Financial Earnings & Bonuses'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isManagement ? 'Earnings & Performance Rewards' : 'My Earnings & Reward Balance'}
            </h1>
            <p className="text-emerald-100/90 text-xs sm:text-sm mt-1 max-w-2xl">
              {isManagement
                ? 'Issue monetary rewards to team members upon successful task completions, project deliverables, and quality work milestones.'
                : 'Track all your verified financial rewards, project completion bonuses, and discretionary incentives granted by leadership.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isManagement && onOpenRewardModal && (
              <button
                type="button"
                onClick={onOpenRewardModal}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Grant Reward with Money</span>
              </button>
            )}

            <button
              type="button"
              onClick={exportStatementCSV}
              disabled={filteredRewards.length === 0}
              className="px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-xl border border-white/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              title="Download earnings statement as CSV"
            >
              <Download className="w-4 h-4 text-emerald-200" />
              <span>Export Statement</span>
            </button>
          </div>
        </div>

        {/* Live Balance Summary Strip */}
        <div className="mt-6 pt-6 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <div className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider">
              {isManagement ? 'Total Workspace Payouts' : 'Total Earnings Received'}
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1">
              {formatMoney(summary.totalEarnings)}
            </div>
            <div className="text-[11px] text-emerald-200 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>{summary.rewardCount} recorded bonus transactions</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <div className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider">
              {isManagement ? 'Average Bonus Payout' : 'Average Per Reward'}
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono mt-1">
              {formatMoney(summary.rewardCount > 0 ? summary.totalEarnings / summary.rewardCount : 0)}
            </div>
            <div className="text-[11px] text-emerald-200 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-amber-300" />
              <span>Independent of XP leveling</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <div className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider">
              Account Payout Status
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1">
              Active Verified
            </div>
            <div className="text-[11px] text-emerald-200 mt-1 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-emerald-300" />
              <span>Full real-time audit ledger</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by member, task title, project, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Member Filter (Admin only) */}
          {isManagement && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Member:</span>
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Team Members</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Reward Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Category:</span>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Categories</option>
              <option value="Task Completion Bonus">Task Completion Bonus</option>
              <option value="Project Milestone Bonus">Project Milestone Bonus</option>
              <option value="Excellence & Speed Award">Excellence & Speed Award</option>
              <option value="Quality & Bug Squashing">Quality & Bug Squashing</option>
              <option value="Monthly Outstanding Performer">Monthly Outstanding Performer</option>
              <option value="Discretionary Admin Bonus">Discretionary Admin Bonus</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rewards Ledger Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">
              {isManagement ? 'Compensation Payout Ledger' : 'My Financial Statement History'}
            </h2>
            <span className="text-xs text-slate-400 font-mono">({filteredRewards.length} records)</span>
          </div>

          <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            Visible Subtotal: {formatMoney(visibleTotal)}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">Loading financial earnings records...</p>
          </div>
        ) : filteredRewards.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">No Rewards or Earnings Recorded Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {isManagement 
                ? 'Click "Grant Reward with Money" above to award any employee for completed tasks or outstanding work.'
                : 'As you complete tasks and hit milestones, admin will grant financial bonuses directly here!'}
            </p>
            {isManagement && onOpenRewardModal && (
              <button
                type="button"
                onClick={onOpenRewardModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Grant First Reward</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Team Member</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Reward Amount</th>
                  <th className="py-3 px-4">Associated Task / Project</th>
                  <th className="py-3 px-4">Awarded By & Notes</th>
                  {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRewards.map((reward) => (
                  <tr key={reward.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(reward.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                    </td>

                    {/* Member */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={reward.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(reward.user_name || 'User')}`}
                          alt={reward.user_name}
                          className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 truncate">{reward.user_name || 'Team Member'}</div>
                          <div className="text-[10px] text-slate-400 truncate">{reward.user_designation || reward.user_email || 'Member'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        reward.reward_type === 'Task Completion Bonus'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : reward.reward_type === 'Project Milestone Bonus'
                          ? 'bg-sky-50 text-sky-800 border border-sky-200'
                          : reward.reward_type === 'Excellence & Speed Award'
                          ? 'bg-amber-50 text-amber-900 border border-amber-200'
                          : 'bg-purple-50 text-purple-800 border border-purple-200'
                      }`}>
                        <Sparkles className="w-3 h-3 text-current" />
                        <span>{reward.reward_type}</span>
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-extrabold text-sm font-mono text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/80 inline-flex items-center gap-1 shadow-2xs">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>{formatMoney(reward.amount, reward.currency)}</span>
                      </div>
                    </td>

                    {/* Task / Project */}
                    <td className="py-3.5 px-4 max-w-xs">
                      {reward.task_title ? (
                        <div>
                          <div className="font-semibold text-slate-800 truncate flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{reward.task_title}</span>
                          </div>
                          {reward.project_name && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <FolderKanban className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{reward.project_name}</span>
                            </div>
                          )}
                        </div>
                      ) : reward.project_name ? (
                        <div className="text-xs text-slate-700 font-medium flex items-center gap-1">
                          <FolderKanban className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{reward.project_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Direct Performance Bonus</span>
                      )}
                    </td>

                    {/* Awarded By & Notes */}
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="text-[11px] font-bold text-slate-700">
                        By {reward.awarded_by || 'Leadership'}
                      </div>
                      {reward.notes && (
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 italic">
                          "{reward.notes}"
                        </p>
                      )}
                    </td>

                    {/* Actions (Admin) */}
                    {isAdmin && (
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeleteReward(reward.id)}
                          disabled={deletingId === reward.id}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                          title="Delete reward entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
