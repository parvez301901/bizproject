import React, { useState } from 'react';
import { 
  ArchiveRestore, 
  RotateCcw, 
  Trash2, 
  Search, 
  UserCheck, 
  Calendar, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldAlert,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function DeactivatedMembers({ deactivatedUsers = [], onRefresh, currentUser }) {
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState(null);

  const isAdmin = currentUser?.role === 'admin';
  const canModifyMembers = isAdmin; // Only admin can restore or delete members

  const filtered = deactivatedUsers.filter(u => 
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.department && u.department.toLowerCase().includes(search.toLowerCase()))
  );

  const handleReactivate = async (user) => {
    if (!canModifyMembers) {
      alert('Permission denied: Managers are not authorized to restore deactivated members.');
      return;
    }
    if (!window.confirm(`Reactivate member "${user.full_name}"? Their profile and historical progress will be restored to the active workspace.`)) {
      return;
    }
    setLoadingId(user.id);
    try {
      await api.updateUserStatus(user.id, 'active', currentUser?.full_name || 'Admin');
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to reactivate member');
    } finally {
      setLoadingId(null);
    }
  };

  const handlePermanentDelete = async (user) => {
    if (!canModifyMembers) {
      alert('Permission denied: Managers are not authorized to delete members.');
      return;
    }
    if (!window.confirm(`PERMANENT DELETE: Are you completely sure you want to permanently delete "${user.full_name}"? This cannot be undone.`)) {
      return;
    }
    setLoadingId(user.id);
    try {
      await api.deleteUser(user.id, currentUser?.full_name || 'Admin');
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to delete member');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 via-slate-50 to-emerald-50/30 border border-amber-200/80 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
            <ArchiveRestore className="w-3.5 h-3.5 text-amber-700" />
            <span>Soft-Deleted Member Recovery Vault</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Deactivated Members & Recovery
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            All soft-deleted employees are completely hidden from active dashboards, rosters, and assignment dropdowns. 
            You can restore them back to full active duty with a single click at any time.
          </p>
        </div>

        <div className="bg-white border border-amber-200 rounded-xl px-4 py-3 text-center shrink-0 shadow-xs">
          <span className="text-2xl font-extrabold text-amber-800 block leading-none">
            {deactivatedUsers.length}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">Deactivated in Vault</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search deactivated members by name, email, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
          />
        </div>
        <span className="text-xs text-slate-400 font-medium">
          Showing {filtered.length} member{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Roster Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-5 py-3.5 min-w-[240px]">Employee Name</th>
                <th className="px-4 py-3.5 w-36">Department</th>
                <th className="px-4 py-3.5 w-32">Role</th>
                <th className="px-4 py-3.5 w-48">Contact</th>
                <th className="px-4 py-3.5 w-32 text-center">Status</th>
                <th className="px-5 py-3.5 w-52 text-right">Recovery Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <UserCheck className="w-10 h-10 mx-auto text-emerald-400/80 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No deactivated members found.</p>
                    <p className="text-xs text-slate-400 mt-0.5">All team members are currently active on the main dashboard.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((user) => {
                  const isLoading = loadingId === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Avatar */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.full_name}`}
                            alt=""
                            className="w-10 h-10 rounded-full border border-slate-200 object-cover grayscale opacity-80"
                          />
                          <div>
                            <div className="font-semibold text-slate-800 text-sm">{user.full_name}</div>
                            <div className="text-xs text-slate-400">{user.designation}</div>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        {user.department || 'General'}
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3.5">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {user.role}
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3.5 text-slate-500 text-xs space-y-0.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                            <Phone className="w-3 h-3 shrink-0" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Deactivated
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        {canModifyMembers ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleReactivate(user)}
                              disabled={isLoading}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                              title="Restore employee back to active dashboard"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restore Member</span>
                            </button>

                            <button
                              onClick={() => handlePermanentDelete(user)}
                              disabled={isLoading}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
                              title="Permanent Hard Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Read-only</span>
                        )}
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
