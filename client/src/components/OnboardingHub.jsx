import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  Briefcase, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  Filter,
  Award,
  Sparkles,
  ChevronDown,
  Trash2,
  Zap
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../LanguageContext';

export default function OnboardingHub({ users = [], onRefresh, onOpenOnboardModal }) {
  const { t } = useLanguage();
  const [selectedUser, setSelectedUser] = useState(null);
  const [userTasks, setUserTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter users
  const onboardingUsers = users.filter(u => u.status === 'onboarding' || (u.onboarding_progress < 100));
  const departments = ['All', ...new Set(users.map(u => u.department).filter(Boolean))];

  const filteredList = onboardingUsers.filter(u => {
    const matchesDept = filterDepartment === 'All' || u.department === filterDepartment;
    const matchesSearch = u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.designation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const selectUser = async (user) => {
    setSelectedUser(user);
    setLoadingTasks(true);
    try {
      const tasks = await api.getUserOnboarding(user.id);
      setUserTasks(tasks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleToggleTask = async (taskId) => {
    try {
      const res = await api.toggleOnboardingTask(taskId);
      // Update local task state
      setUserTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: res.is_completed } : t));
      // Update user in parent
      if (selectedUser) {
        setSelectedUser(prev => ({
          ...prev,
          onboarding_progress: res.progressPercent,
          status: res.userStatus,
          xp: (prev.xp || 0) + (res.xpGained || 0),
          level: Math.floor(((prev.xp || 0) + (res.xpGained || 0)) / 100) + 1
        }));
      }
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  // Form state for assigning a new onboarding task
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newXpReward, setNewXpReward] = useState(35);
  const [addingTask, setAddingTask] = useState(false);

  const handleAddNewTask = async (e) => {
    e.preventDefault();
    if (!selectedUser || !newTitle.trim()) return;
    try {
      setAddingTask(true);
      const created = await api.addOnboardingTask(selectedUser.id, {
        title: newTitle.trim(),
        category: newCategory,
        xp_reward: Number(newXpReward) || 35
      });
      setUserTasks(prev => [...prev, created]);
      setNewTitle('');
      onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to assign onboarding task');
    } finally {
      setAddingTask(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm(t('onboarding.deleteTaskConfirm'))) return;
    try {
      await api.deleteOnboardingTask(taskId);
      setUserTasks(prev => prev.filter(t => t.id !== taskId));
      onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to delete task');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header Banner with Soft Light Greenish Styling */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/40 to-slate-50 border border-emerald-100/80 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Employee Lifecycle & Enablement</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Employee Onboarding Hub
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            Provision new team members, track legal and IT clearance checklists, assign mentors, and guide new hires from Day 1 to full productivity.
          </p>
        </div>

        <button
          onClick={onOpenOnboardModal}
          className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard New Employee</span>
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Active Onboarding Candidate Roster */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span>Active New Hires</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-semibold">
                {onboardingUsers.length} in progress
              </span>
            </h2>
          </div>

          {/* Search & Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
              />
            </div>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-600 focus:outline-none focus:border-emerald-500"
            >
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* List of candidates */}
          <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
            {filteredList.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <UserCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium">No candidates in onboarding stage.</p>
                <p className="text-xs">Click "Onboard New Employee" to register a hire.</p>
              </div>
            ) : (
              filteredList.map((user) => {
                const isSelected = selectedUser?.id === user.id;
                return (
                  <div
                    key={user.id}
                    onClick={() => selectUser(user)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-sm'
                        : 'border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.full_name}`}
                          alt={user.full_name}
                          className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                        />
                        <div>
                          <h3 className="text-sm font-semibold text-slate-800 leading-snug">{user.full_name}</h3>
                          <p className="text-xs text-slate-500 leading-tight">{user.designation}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        {user.onboarding_progress}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${user.onboarding_progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {user.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Started {user.join_date}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Detailed Checklist & Profile Inspection */}
        <div className="lg:col-span-7">
          {selectedUser ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
              {/* Profile Card Summary */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.full_name}`}
                    alt={selectedUser.full_name}
                    className="w-16 h-16 rounded-2xl border-2 border-emerald-200 object-cover shadow-sm"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">{selectedUser.full_name}</h2>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {selectedUser.status === 'active' ? 'Fully Onboarded' : 'In Onboarding'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedUser.designation} &bull; {selectedUser.department}</p>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400" />{selectedUser.email}</span>
                      {selectedUser.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" />{selectedUser.location}</span>}
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Level {selectedUser.level || 1} ({selectedUser.xp || 0} XP)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-600">{selectedUser.onboarding_progress}%</div>
                  <div className="text-xs text-slate-400">Roadmap Completion</div>
                </div>
              </div>

              {/* Skills Tags */}
              {selectedUser.skills && selectedUser.skills.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Verified Skillsets</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUser.skills.map((skill, i) => (
                      <span key={i} className="text-xs bg-slate-100 text-slate-700 font-medium px-2.5 py-1 rounded-md">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Checklist Tasks */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Onboarding Checklist</h3>
                    <p className="text-xs text-slate-500">Click tasks to mark them complete or in-progress.</p>
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    {userTasks.filter(t => t.is_completed).length} of {userTasks.length} Completed
                  </span>
                </div>

                {/* Form to Assign a New Custom Task with Reward to this Employee */}
                <form onSubmit={handleAddNewTask} className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      {t('onboarding.assignNewTaskPrompt')}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium">{t('onboarding.instantRewardNote')}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder={t('onboarding.taskTitlePlaceholder')}
                      className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 w-full font-medium"
                    />
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-2 text-slate-700 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="HR">HR</option>
                        <option value="IT Security">IT Security</option>
                        <option value="Training">Training</option>
                        <option value="Dev & Tools">Dev & Tools</option>
                        <option value="Culture">Culture</option>
                        <option value="General">General</option>
                      </select>
                      <select
                        value={newXpReward}
                        onChange={(e) => setNewXpReward(Number(e.target.value))}
                        className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-2 text-amber-800 font-bold focus:outline-none focus:border-emerald-500"
                      >
                        <option value={20}>+20 XP</option>
                        <option value={35}>+35 XP</option>
                        <option value={50}>+50 XP</option>
                        <option value={75}>+75 XP</option>
                        <option value={100}>+100 XP</option>
                      </select>
                      <button
                        type="submit"
                        disabled={addingTask}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer shadow-2xs"
                      >
                        {addingTask ? t('onboarding.assigning') : t('onboarding.assignBtn')}
                      </button>
                    </div>
                  </div>
                </form>

                {loadingTasks ? (
                  <div className="py-8 text-center text-sm text-slate-400">Loading checklist items...</div>
                ) : (
                  <div className="space-y-2">
                    {userTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                          task.is_completed
                            ? 'bg-emerald-50/30 border-emerald-200/80 text-slate-600'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                        }`}
                      >
                        <div 
                          className="pt-0.5 cursor-pointer"
                          onClick={() => handleToggleTask(task.id)}
                          title="Click to toggle completion"
                        >
                          {task.is_completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 hover:border-emerald-500 transition-colors" />
                          )}
                        </div>
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => handleToggleTask(task.id)}
                        >
                          <p className={`text-sm font-medium ${task.is_completed ? 'line-through text-slate-400' : ''}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                              {task.category}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              +{task.xp_reward || 35} XP
                            </span>
                            {task.due_date && <span>Due: {task.due_date}</span>}
                            {task.completed_at && <span className="text-emerald-600 font-medium">Completed</span>}
                          </div>
                        </div>

                        {/* Delete Task Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.id);
                          }}
                          className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                          title="Remove task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-sm text-slate-400 space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-semibold text-slate-700">Select an Employee</h3>
              <p className="text-xs max-w-sm mx-auto">
                Click on any candidate from the roster on the left to inspect their progress, verify checklist requirements, and manage their onboarding plan.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
