import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  CheckCircle, 
  Clock, 
  Plus,
  Briefcase,
  UserX,
  UserCheck,
  Trash2,
  AlertTriangle,
  MoreVertical,
  Edit2,
  X,
  Check,
  Save,
  Camera
} from 'lucide-react';
import { api } from '../services/api';

const ROLE_BADGES = {
  'admin': 'bg-purple-50 text-purple-700 border-purple-200',
  'manager': 'bg-blue-50 text-blue-700 border-blue-200',
  'member': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'guest': 'bg-slate-100 text-slate-600 border-slate-200'
};

export default function TeamDirectory({ users = [], onRefresh, onOpenOnboardModal, currentUser, onUpdateCurrentUser }) {
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'active', 'deactivated'
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Edit Member Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [editFullName, setEditFullName] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const isAdmin = currentUser?.role === 'admin';
  const canModifyMembers = isAdmin; // Only admin can add or delete/deactivate members

  const departments = ['All', ...new Set(users.map(u => u.department).filter(Boolean))];

  const filtered = users.filter(u => {
    const matchesSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) ||
                          u.email.toLowerCase().includes(search.toLowerCase()) ||
                          u.designation.toLowerCase().includes(search.toLowerCase());
    const matchesDept = departmentFilter === 'All' || u.department === departmentFilter;
    const matchesStatus = statusFilter === 'All' 
      ? true 
      : statusFilter === 'deactivated' 
        ? u.status === 'deactivated'
        : u.status !== 'deactivated';
    return matchesSearch && matchesDept && matchesStatus;
  });

  // Soft-Delete (Deactivate) or Reactivate
  const handleToggleStatus = async (user) => {
    if (!canModifyMembers) {
      alert('Permission denied: Only administrators are authorized to deactivate or reactivate members.');
      return;
    }
    const isSelf = Boolean(currentUser && (user.id === currentUser.id || (currentUser.email && user.email?.toLowerCase() === currentUser.email.toLowerCase())));
    if (isSelf) {
      alert('Action not allowed: You cannot deactivate your own account.');
      return;
    }
    const newStatus = user.status === 'deactivated' ? 'active' : 'deactivated';
    const confirmMessage = newStatus === 'deactivated'
      ? `Soft-delete (deactivate) member "${user.full_name}"? Their account will be inactive and logged in the audit trail.`
      : `Reactivate member "${user.full_name}"?`;

    if (!window.confirm(confirmMessage)) return;

    setActionLoadingId(user.id);
    try {
      await api.updateUserStatus(user.id, newStatus, currentUser?.full_name || 'Admin');
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Permanent Delete
  const handleDeletePermanent = async (user) => {
    if (!canModifyMembers) {
      alert('Permission denied: Only administrators are authorized to delete members.');
      return;
    }
    const isSelf = Boolean(currentUser && (user.id === currentUser.id || (currentUser.email && user.email?.toLowerCase() === currentUser.email.toLowerCase())));
    if (isSelf) {
      alert('Action not allowed: You cannot delete your own account.');
      return;
    }
    if (!window.confirm(`PERMANENT DELETE: Are you sure you want to completely erase "${user.full_name}" and their checklist data from the database? This action will be logged in the audit trail.`)) {
      return;
    }

    setActionLoadingId(user.id);
    try {
      await api.deleteUser(user.id, currentUser?.full_name || 'Admin');
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to delete member');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditFullName(user.full_name || '');
    setEditDesignation(user.designation || '');
    setEditDepartment(user.department || '');
    setEditPhone(user.phone || '');
    setEditLocation(user.location || '');
    setEditError('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser || !editFullName.trim()) return;

    try {
      setSavingEdit(true);
      setEditError('');

      const updated = await api.updateUser(editingUser.id, {
        full_name: editFullName.trim(),
        designation: editDesignation.trim(),
        department: editDepartment.trim(),
        phone: editPhone.trim(),
        location: editLocation.trim(),
        actor_name: currentUser?.full_name || 'Admin'
      });

      // If editing self, update currentUser session
      if (currentUser && (editingUser.id === currentUser.id || editingUser.email?.toLowerCase() === currentUser.email?.toLowerCase())) {
        if (onUpdateCurrentUser) {
          onUpdateCurrentUser({
            ...currentUser,
            full_name: editFullName.trim(),
            designation: editDesignation.trim(),
            department: editDepartment.trim(),
            phone: editPhone.trim(),
            location: editLocation.trim()
          });
        }
      }

      if (onRefresh) onRefresh();
      setEditingUser(null);
    } catch (err) {
      console.error('Failed to update member:', err);
      setEditError(err.message || 'Failed to update member details.');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            {canModifyMembers 
              ? 'Manage personnel, assign roles, soft-delete (deactivate), or permanently remove members with audit tracking.'
              : 'View team members, designations, departments, contact details, and project assignments.'}
          </p>
        </div>
        {canModifyMembers && (
          <button
            onClick={onOpenOnboardModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Team Member</span>
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, role or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 focus:outline-none focus:border-emerald-500"
          >
            {departments.map(d => (
              <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
            ))}
          </select>

          {/* Status / Soft-Delete Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 focus:outline-none focus:border-emerald-500"
          >
            <option value="All">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="deactivated">Deactivated (Soft-Deleted)</option>
          </select>
        </div>
      </div>

      {/* Grid of Team Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl">
            <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold">No members match this filter</p>
          </div>
        ) : (
          filtered.map((user) => {
            const roleBadge = ROLE_BADGES[user.role] || ROLE_BADGES['member'];
            const isDeactivated = user.status === 'deactivated';
            const isLoading = actionLoadingId === user.id;
            const isSelf = Boolean(currentUser && (user.id === currentUser.id || (currentUser.email && user.email?.toLowerCase() === currentUser.email.toLowerCase())));

            return (
              <div
                key={user.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-4 group relative ${
                  isDeactivated
                    ? 'border-slate-300 bg-slate-50/70 opacity-75'
                    : isSelf
                      ? 'border-emerald-300 ring-1 ring-emerald-200/50 bg-white'
                      : 'border-slate-200/80 hover:border-emerald-300'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.full_name}`}
                      alt={user.full_name}
                      className={`w-12 h-12 rounded-xl border border-slate-200 object-cover shadow-xs ${isDeactivated ? 'grayscale' : ''}`}
                    />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors flex items-center gap-1.5 flex-wrap">
                        <span>{user.full_name}</span>
                        {isSelf && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full border border-emerald-200">
                            You
                          </span>
                        )}
                        {isDeactivated && (
                          <span className="text-[10px] bg-rose-100 text-rose-700 font-semibold px-1.5 py-0.2 rounded">
                            Inactive
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500">{user.designation}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${roleBadge}`}>
                      {user.role}
                    </span>
                    {canModifyMembers && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(user);
                        }}
                        className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-emerald-200"
                        title={`Edit ${user.full_name}'s name and details`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Status and Progress */}
                <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Account Status</span>
                    <span className={`font-semibold capitalize flex items-center gap-1 ${
                      isDeactivated 
                        ? 'text-rose-700' 
                        : user.status === 'active' 
                          ? 'text-emerald-700' 
                          : 'text-amber-700'
                    }`}>
                      {isDeactivated ? (
                        <>
                          <UserX className="w-3.5 h-3.5" />
                          Deactivated
                        </>
                      ) : user.status === 'active' ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          Active
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          Onboarding
                        </>
                      )}
                    </span>
                  </div>

                  {/* Gamification Level & XP */}
                  <div className="pt-1.5 border-t border-slate-200/60 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                        Level {user.level || 1}
                      </span>
                      <span className="font-mono text-slate-500 font-semibold">
                        {user.xp || 0} XP
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, ((user.xp || 0) % 100))}%` }} 
                      />
                    </div>
                  </div>

                  {user.status === 'onboarding' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Onboarding Checklist</span>
                        <span className="font-semibold text-emerald-600">{user.onboarding_progress}%</span>
                      </div>
                      <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${user.onboarding_progress}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact & Meta */}
                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{user.location}</span>
                    </div>
                  )}
                </div>

                {/* Actions: Edit Details, Soft-Delete (Deactivate) and Permanent Delete */}
                {canModifyMembers && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {/* Edit Name & Profile button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(user)}
                      className="py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-800"
                      title="Edit member name and role"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Edit Info</span>
                    </button>

                    {isSelf ? (
                      <div className="flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold text-slate-400 bg-slate-50 border border-slate-200/80 text-center select-none">
                        Protected Self
                      </div>
                    ) : (
                      <>
                        {/* Soft Delete / Reactivate Toggle */}
                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={isLoading}
                          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                            isDeactivated
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {isDeactivated ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Reactivate</span>
                            </>
                          ) : (
                            <>
                              <UserX className="w-3.5 h-3.5" />
                              <span>Deactivate</span>
                            </>
                          )}
                        </button>

                        {/* Permanent Hard Delete */}
                        <button
                          onClick={() => handleDeletePermanent(user)}
                          disabled={isLoading}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
                          title="Permanently Delete Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Edit Member Details Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white relative">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="absolute top-5 right-5 p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-emerald-100 text-xs font-semibold mb-2">
                <Edit2 className="w-3.5 h-3.5 text-amber-300" />
                <span>Admin Member Editor</span>
              </div>
              <h2 className="text-xl font-extrabold tracking-tight">Edit Member Profile</h2>
              <p className="text-emerald-100/90 text-xs mt-1">
                Update name, job title, department, or contact details for this account.
              </p>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-emerald-500 focus:bg-white transition-colors"
                />
              </div>

              {/* Job Title / Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Job Title / Designation
                  </label>
                  <input
                    type="text"
                    value={editDesignation}
                    onChange={(e) => setEditDesignation(e.target.value)}
                    placeholder="e.g. Lead QA Engineer"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-emerald-500 focus:bg-white transition-colors"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    placeholder="e.g. Quality Assurance"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-emerald-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Phone & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+1 555-0192"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-emerald-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Location / Office
                  </label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="e.g. New York, NY"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-emerald-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  disabled={savingEdit}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit || !editFullName.trim()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingEdit ? 'Saving...' : 'Save Member Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
