import React, { useState, useEffect } from 'react';
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
  Zap,
  User,
  ArrowRight,
  Trophy,
  Check,
  Gift,
  Camera,
  Edit2,
  AlertCircle,
  FileCheck,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../LanguageContext';
import UploadMemberImageModal from './UploadMemberImageModal';

export default function OnboardingHub({ users = [], onRefresh, onOpenOnboardModal, currentUser, onUpdateCurrentUser }) {
  const { t } = useLanguage();
  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const isTeamMember = currentUser?.role === 'team' || currentUser?.role === 'member';
  const canOnboard = isAdmin; // Only admin can create/onboard new members

  const [selectedUser, setSelectedUser] = useState(null);
  const [userTasks, setUserTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Edit Candidate Profile Modal State
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfileDesignation, setEditProfileDesignation] = useState('');
  const [editProfileDepartment, setEditProfileDepartment] = useState('');
  const [editProfilePhone, setEditProfilePhone] = useState('');
  const [editProfileLocation, setEditProfileLocation] = useState('');
  const [savingCandidateProfile, setSavingCandidateProfile] = useState(false);

  // Admin Master Template State (Common tasks set for any new user)
  const [adminSubTab, setAdminSubTab] = useState('candidates'); // 'candidates' | 'common_template'
  const [commonTasks, setCommonTasks] = useState([]);
  const [loadingCommonTasks, setLoadingCommonTasks] = useState(false);
  const [newCommonTitle, setNewCommonTitle] = useState('');
  const [newCommonCategory, setNewCommonCategory] = useState('General');
  const [newCommonXp, setNewCommonXp] = useState(35);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  // Team Member Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [insertedName, setInsertedName] = useState(currentUser?.full_name || '');
  const [savingName, setSavingName] = useState(false);
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [xpAwardedPopup, setXpAwardedPopup] = useState(false);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [teamTasks, setTeamTasks] = useState([]);

  const loadCommonTasks = async () => {
    try {
      setLoadingCommonTasks(true);
      const res = await api.getCommonOnboardingTasks();
      setCommonTasks(res || []);
    } catch (e) {
      console.warn('Failed to load common onboarding tasks:', e);
    } finally {
      setLoadingCommonTasks(false);
    }
  };

  useEffect(() => {
    if (isAdmin || isManager) {
      loadCommonTasks();
    }
  }, [isAdmin, isManager]);

  const handleCreateCommonTask = async (e) => {
    e.preventDefault();
    if (!newCommonTitle.trim()) return;
    try {
      const created = await api.createCommonOnboardingTask({
        title: newCommonTitle.trim(),
        category: newCommonCategory,
        xp_reward: Number(newCommonXp) || 35,
        actor_name: currentUser?.full_name || 'Admin'
      });
      setCommonTasks(prev => [...prev, created]);
      setNewCommonTitle('');
      setSyncStatusMsg('Common task added! Every new user will now automatically receive this task.');
      setTimeout(() => setSyncStatusMsg(''), 4500);
    } catch (err) {
      alert(err.message || 'Failed to create common task');
    }
  };

  const handleDeleteCommonTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to remove this task from the common template?')) return;
    try {
      await api.deleteCommonOnboardingTask(taskId);
      setCommonTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      alert(err.message || 'Failed to remove common task');
    }
  };

  const handleSyncCommonTasksToAll = async () => {
    try {
      const res = await api.syncCommonOnboardingTasks();
      setSyncStatusMsg(`Successfully assigned common tasks across all ${res.syncedUsersCount} active members!`);
      if (onRefresh) onRefresh();
      setTimeout(() => setSyncStatusMsg(''), 5000);
    } catch (err) {
      alert(err.message || 'Failed to sync common tasks');
    }
  };

  // Auto-select user or load current user's onboarding tasks
  useEffect(() => {
    if (currentUser?.id) {
      api.getUserOnboarding(currentUser.id).then(tasks => {
        setTeamTasks(tasks || []);
      }).catch(console.error);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (!isAdmin && !isManager && currentUser) {
      setSelectedUser(currentUser);
    }
  }, [currentUser, isAdmin, isManager]);

  // Top XP calculations
  const memberXp = currentUser?.xp || 0;
  const memberLevel = currentUser?.level || 1;
  const xpThreshold = 100;
  const xpBarPercent = Math.min(100, Math.round((memberXp / xpThreshold) * 100));

  // Handler for inserting name and earning 5 XP (One-time only!)
  const hasClaimedNameReward = Number(currentUser?.name_reward_claimed) === 1;

  const handleInsertNameSubmit = async (e) => {
    e.preventDefault();
    if (!insertedName.trim() || savingName) return;

    try {
      setSavingName(true);
      const shouldAwardNameXp = !hasClaimedNameReward;
      const newXp = shouldAwardNameXp ? memberXp + 5 : memberXp;
      
      const updated = await api.updateUser(currentUser.id, {
        full_name: insertedName.trim(),
        xp: newXp,
        name_reward_claimed: 1
      });

      setNameSubmitted(true);
      if (shouldAwardNameXp) {
        setXpAwardedPopup(true);
      }

      if (onUpdateCurrentUser) {
        onUpdateCurrentUser({
          ...currentUser,
          full_name: insertedName.trim(),
          xp: newXp,
          level: Math.floor(newXp / 100) + 1,
          name_reward_claimed: 1
        });
      }

      // Proceed to Next Step after brief reward celebration
      setTimeout(() => {
        setXpAwardedPopup(false);
        setWizardStep(2);
      }, shouldAwardNameXp ? 1400 : 300);
    } catch (err) {
      alert(err.message || 'Failed to save name');
    } finally {
      setSavingName(false);
    }
  };

  // Task Edit Modal / Inline State
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('General');
  const [editDueDate, setEditDueDate] = useState('');
  const [editXpReward, setEditXpReward] = useState(35);
  const [savingEdit, setSavingEdit] = useState(false);

  const startEditTask = (task) => {
    setEditingTask(task);
    setEditTitle(task.title || '');
    setEditCategory(task.category || 'General');
    setEditDueDate(task.due_date || '');
    setEditXpReward(Number(task.xp_reward) || 35);
  };

  const handleSaveEditTask = async (e) => {
    e.preventDefault();
    if (!editingTask || !editTitle.trim()) return;
    try {
      setSavingEdit(true);
      const updated = await api.updateOnboardingTask(editingTask.id, {
        title: editTitle.trim(),
        category: editCategory,
        due_date: editDueDate,
        xp_reward: Number(editXpReward) || 35,
        actor_name: currentUser?.full_name || 'User'
      });
      // Update in team tasks
      setTeamTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...updated } : t));
      // Update in user tasks
      setUserTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...updated } : t));
      setEditingTask(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to update task');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleTeamTask = async (taskId) => {
    try {
      const res = await api.toggleOnboardingTask(
        taskId, 
        currentUser?.full_name || 'Member', 
        currentUser?.role || 'member'
      );
      setTeamTasks(prev => prev.map(t => t.id === taskId ? { 
        ...t, 
        is_completed: res.is_completed, 
        approval_status: res.approval_status,
        xp_claimed: res.xp_claimed
      } : t));

      if (res.requiresApproval) {
        setSyncStatusMsg('Task submitted! XP will be awarded once your Admin approves it.');
        setTimeout(() => setSyncStatusMsg(''), 4500);
      } else if (res.xpGained > 0) {
        setSyncStatusMsg(`+${res.xpGained} XP awarded!`);
        setTimeout(() => setSyncStatusMsg(''), 4000);
      }

      if (currentUser && onUpdateCurrentUser) {
        onUpdateCurrentUser({
          ...currentUser,
          onboarding_progress: res.progressPercent,
          status: res.userStatus,
          xp: (currentUser.xp || 0) + (res.xpGained || 0),
          level: Math.floor(((currentUser.xp || 0) + (res.xpGained || 0)) / 100) + 1
        });
      }
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

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

  const handleToggleTask = async (taskId, customAction) => {
    try {
      const res = await api.toggleOnboardingTask(
        taskId, 
        currentUser?.full_name || 'Admin', 
        currentUser?.role || 'admin',
        customAction
      );
      // Update local task state
      setUserTasks(prev => prev.map(t => t.id === taskId ? { 
        ...t, 
        is_completed: res.is_completed,
        approval_status: res.approval_status,
        xp_claimed: res.xp_claimed
      } : t));

      if (customAction === 'approve') {
        setSyncStatusMsg(`Task approved! +${res.xpGained || 0} XP awarded to employee.`);
        setTimeout(() => setSyncStatusMsg(''), 4500);
      }

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
        xp_reward: Number(newXpReward) || 35,
        created_by: 'admin',
        actor_name: currentUser?.full_name || 'Admin'
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
      {/* TOP XP BAR: Prominently visible at the very top of the onboarding screen */}
      <div className="bg-white border border-emerald-200/90 rounded-2xl p-4 sm:p-5 shadow-sm shadow-emerald-500/5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 flex items-center justify-center text-white shadow-xs">
              <Trophy className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Onboarding XP Progression
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Level {memberLevel} Novice
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete onboarding steps to accumulate XP, unlock leaderboard standing, and graduate to full productivity.
              </p>
            </div>
          </div>

          <div className="flex items-baseline sm:text-right gap-1.5 self-start sm:self-center">
            <span className="text-2xl font-extrabold text-emerald-700">{memberXp}</span>
            <span className="text-xs font-semibold text-slate-400">/ 100 XP to Level 1</span>
          </div>
        </div>

        {/* The Live EXP Bar Strip */}
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200/60 relative">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 rounded-full transition-all duration-700 ease-out shadow-xs"
            style={{ width: `${Math.max(5, xpBarPercent)}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 mt-1.5 px-0.5">
          <span>0 XP (Start)</span>
          <span className="text-emerald-700 font-bold">{xpBarPercent}% Milestone</span>
          <span>100 XP (Level 1 Promotion)</span>
        </div>
      </div>

      {/* Floating XP Reward Notification Popup */}
      {xpAwardedPopup && (
        <div className="fixed top-8 right-8 z-50 animate-bounce">
          <div className="flex items-center gap-3 px-4 py-3 bg-emerald-600 text-white font-bold text-sm rounded-2xl shadow-xl shadow-emerald-700/30 border border-emerald-400">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span>+5 XP Earned! Name successfully registered!</span>
          </div>
        </div>
      )}

      {/* TEAM MEMBER PERSONAL ONBOARDING WIZARD */}
      {isTeamMember ? (
        <div className="space-y-6">
          {/* Wizard Step Progression Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-4 rounded-2xl border transition-all ${
              wizardStep === 1 
                ? 'bg-emerald-50/80 border-emerald-400 shadow-sm' 
                : (wizardStep > 1 ? 'bg-white border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-400')
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Step 01</span>
                {wizardStep > 1 ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200/80 text-emerald-900">+5 XP</span>
                )}
              </div>
              <h3 className="font-bold text-sm text-slate-800">Identity & Full Name</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Set up your official workspace name</p>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${
              wizardStep === 2 
                ? 'bg-emerald-50/80 border-emerald-400 shadow-sm' 
                : (wizardStep > 2 ? 'bg-white border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-400')
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Step 02</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">+35 XP/task</span>
              </div>
              <h3 className="font-bold text-sm text-slate-800">Checklist & Compliance</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Complete onboarding checklists</p>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${
              wizardStep === 3 
                ? 'bg-emerald-50/80 border-emerald-400 shadow-sm' 
                : 'bg-white border-slate-200 text-slate-400'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Step 03</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-900">+150 XP</span>
              </div>
              <h3 className="font-bold text-sm text-slate-800">Full Readiness</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Graduation & project collaboration</p>
            </div>
          </div>

          {/* STEP 1: Insert Name and Get 5 XP */}
          {wizardStep === 1 && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
                    <Gift className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Instant Reward: +5 XP</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Step 1: Confirm or Insert Your Full Name
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
                    Enter your real full name to personalize your workspace profile, project assignments, and company leaderboard ranking. You will immediately receive <strong>+5 XP</strong>!
                  </p>
                </div>

                {hasClaimedNameReward ? (
                  <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200/70 text-emerald-900 flex items-center gap-3 shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <div>
                      <span className="text-xs font-bold block">Reward Claimed</span>
                      <span className="text-xs font-bold text-emerald-700">+5 XP Collected</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/70 text-amber-900 flex items-center gap-3 shrink-0">
                    <Sparkles className="w-6 h-6 text-amber-500" />
                    <div>
                      <span className="text-xs font-bold block">Reward Available</span>
                      <span className="text-base font-extrabold text-amber-700">+5 XP</span>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleInsertNameSubmit} className="max-w-xl space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={insertedName}
                      onChange={(e) => setInsertedName(e.target.value)}
                      placeholder="e.g. Alex Henderson"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white font-medium text-slate-800 transition-all shadow-2xs"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    This name will appear on all your task updates, boards, and leaderboard milestones. You can edit it at any time.
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={savingName || !insertedName.trim()}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <span>
                      {savingName 
                        ? (hasClaimedNameReward ? 'Updating Name...' : 'Saving & Awarding +5 XP...') 
                        : (hasClaimedNameReward ? 'Update Name' : 'Submit Name & Claim +5 XP')}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Next Step &rarr;
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2: Complete Assigned Onboarding Tasks */}
          {wizardStep === 2 && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Next Step: Checklist Completion</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Step 2: Complete Your Onboarding Checklist
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
                    Check off each onboarding task as you finish it. Each task awards bonus XP directly to your account.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    &larr; Previous Step
                  </button>
                  <button
                    onClick={() => setWizardStep(3)}
                    className="px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                  >
                    Step 3: Readiness &rarr;
                  </button>
                </div>
              </div>

              {/* Task list for team member */}
              <div className="space-y-3">
                {teamTasks.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">All initial requirements cleared!</p>
                    <p className="text-xs text-slate-400 mt-1">Admin will assign further project-specific tasks as needed.</p>
                  </div>
                ) : (
                  teamTasks.map((task) => {
                    const isPendingApproval = task.approval_status === 'pending_approval';
                    const isApproved = task.approval_status === 'approved';
                    const hasClaimedXp = Number(task.xp_claimed) === 1;

                    return (
                      <div
                        key={task.id}
                        className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all ${
                          task.is_completed 
                            ? 'bg-emerald-50/40 border-emerald-200 text-slate-600' 
                            : 'bg-white border-slate-200/90 hover:border-emerald-300 hover:shadow-xs text-slate-800'
                        }`}
                      >
                        <div 
                          className="pt-0.5 cursor-pointer"
                          onClick={() => handleToggleTeamTask(task.id)}
                          title={task.is_completed ? "Mark uncompleted" : "Submit / Complete task"}
                        >
                          {task.is_completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 hover:border-emerald-500 transition-colors" />
                          )}
                        </div>
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => handleToggleTeamTask(task.id)}
                        >
                          <p className={`text-sm font-bold ${task.is_completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {task.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 text-xs text-slate-400">
                            <span className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-0.5 rounded-md">
                              {task.category || 'General'}
                            </span>

                            {/* XP Reward Badge: Shows if XP is awarded, already claimed, or waiting for approval */}
                            {hasClaimedXp ? (
                              <span className="text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded-full text-[11px] flex items-center gap-1">
                                <Trophy className="w-3 h-3 text-emerald-600" />
                                +{task.xp_reward || 35} XP Claimed
                              </span>
                            ) : (
                              <span className="text-amber-800 bg-amber-100 font-bold px-2 py-0.5 rounded-full text-[11px] flex items-center gap-1">
                                <Trophy className="w-3 h-3 text-amber-600" />
                                +{task.xp_reward || 35} XP
                              </span>
                            )}

                            {/* Status tags */}
                            {isPendingApproval && (
                              <span className="text-amber-800 bg-amber-50 border border-amber-200/80 font-bold px-2 py-0.5 rounded-full text-[11px] flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Submitted &bull; Waiting Admin Approval
                              </span>
                            )}

                            {isApproved && task.is_completed && (
                              <span className="text-emerald-700 font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                Approved & Completed
                              </span>
                            )}

                            {task.due_date && <span>Due: {task.due_date}</span>}
                          </div>
                        </div>

                        {/* Edit Task Button */}
                        <div className="flex items-center gap-1 shrink-0 pt-0.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditTask(task);
                            }}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit task description or details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Readiness & Graduation */}
          {wizardStep === 3 && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
              <div className="text-center max-w-lg mx-auto space-y-3 py-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                  <Sparkles className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  You're Ready for Prime Production!
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Congratulations on completing your onboarding journey. You can now access your assigned projects, view instruction videos, collaborate on the team message board, and track daily work logs.
                </p>

                <div className="pt-4 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    &larr; Back to Checklist
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    Go to My Overview
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Header Banner with Soft Light Greenish Styling (Admin & Manager View) */}
      {!isTeamMember && (
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

          {canOnboard && (
            <button
              onClick={onOpenOnboardModal}
              className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard New Employee</span>
            </button>
          )}
        </div>
      )}

      {/* Admin/Manager Sub-Navigation: Candidate Rosters vs Common New User Template */}
      {!isTeamMember && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/90 pb-4">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setAdminSubTab('candidates')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                adminSubTab === 'candidates'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Candidate Checklists ({onboardingUsers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setAdminSubTab('common_template')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                adminSubTab === 'common_template'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Common New User Tasks ({commonTasks.length})</span>
            </button>
          </div>

          {adminSubTab === 'common_template' && (
            <button
              type="button"
              onClick={handleSyncCommonTasksToAll}
              className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Assign common tasks to all active members who don't have them yet"
            >
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>Sync Common Tasks to All Members</span>
            </button>
          )}
        </div>
      )}

      {syncStatusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

      {/* View 1: Candidate Checklists Roster */}
      {!isTeamMember && adminSubTab === 'candidates' && (
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
                  <div className="relative group shrink-0">
                    <img
                      src={selectedUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedUser.full_name)}`}
                      alt={selectedUser.full_name}
                      className="w-16 h-16 rounded-2xl border-2 border-emerald-200 object-cover shadow-sm bg-emerald-50"
                    />
                    {(selectedUser.id === currentUser?.id || isAdmin) && (
                      <button
                        type="button"
                        onClick={() => setShowPhotoModal(true)}
                        className="absolute inset-0 bg-black/45 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Upload Member Photo"
                      >
                        <Camera className="w-4 h-4 text-white" />
                        <span className="text-[9px] font-bold mt-0.5">Edit</span>
                      </button>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">{selectedUser.full_name}</h2>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {selectedUser.status === 'active' ? 'Fully Onboarded' : 'In Onboarding'}
                      </span>
                      {(isAdmin || isManager) && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditProfileName(selectedUser.full_name || '');
                            setEditProfileDesignation(selectedUser.designation || '');
                            setEditProfileDepartment(selectedUser.department || '');
                            setEditProfilePhone(selectedUser.phone || '');
                            setEditProfileLocation(selectedUser.location || '');
                            setShowEditProfileModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-transparent hover:border-emerald-200 transition-colors cursor-pointer"
                          title="Edit member name and profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
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
                    {userTasks.map((task) => {
                      const isPendingApproval = task.approval_status === 'pending_approval';
                      const isApproved = task.approval_status === 'approved';
                      const hasClaimedXp = Number(task.xp_claimed) === 1;

                      return (
                        <div
                          key={task.id}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                            task.is_completed
                              ? 'bg-emerald-50/30 border-emerald-200/80 text-slate-600'
                              : (isPendingApproval 
                                ? 'bg-amber-50/40 border-amber-300 text-slate-800' 
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800')
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
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400">
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                                {task.category}
                              </span>

                              {hasClaimedXp ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                  <Trophy className="w-3 h-3 text-emerald-600" />
                                  +{task.xp_reward || 35} XP Claimed
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                                  <Trophy className="w-3 h-3 text-amber-600" />
                                  +{task.xp_reward || 35} XP
                                </span>
                              )}

                              {isPendingApproval && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  Pending Admin Approval
                                </span>
                              )}

                              {isApproved && task.is_completed && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                                  Approved
                                </span>
                              )}

                              {task.due_date && <span>Due: {task.due_date}</span>}
                              {task.completed_at && <span className="text-emerald-600 font-medium">Completed</span>}
                            </div>
                          </div>

                          {/* Admin Action Buttons: Approve pending submissions, Edit task, Delete task */}
                          <div className="flex items-center gap-1 shrink-0 pt-0.5">
                            {isPendingApproval && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleTask(task.id, 'approve');
                                }}
                                className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                                title="Approve task completion and award XP to member"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve & Award XP</span>
                              </button>
                            )}

                            {/* Edit Task Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditTask(task);
                              }}
                              className="text-slate-400 hover:text-emerald-600 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Edit task"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Task Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTask(task.id);
                              }}
                              className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Remove task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
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
      )}

      {/* View 2: Common New User Tasks Template (Auto-assigned to every new user) */}
      {!isTeamMember && adminSubTab === 'common_template' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Description Box */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Global Onboarding Roadmap Template</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Common Tasks Set for New Users
              </h2>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                Every new user who registers or is onboarded into the workspace automatically has these tasks created in their roadmap, complete with gamification completion XP rewards.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-white border border-emerald-200 rounded-xl px-4 py-2.5 shadow-2xs text-center">
                <div className="text-xl font-extrabold text-emerald-700">{commonTasks.length}</div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Common Tasks</div>
              </div>
              <div className="bg-white border border-amber-200 rounded-xl px-4 py-2.5 shadow-2xs text-center">
                <div className="text-xl font-extrabold text-amber-700">
                  {commonTasks.reduce((sum, t) => sum + (Number(t.xp_reward) || 35), 0)} XP
                </div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Reward</div>
              </div>
            </div>
          </div>

          {/* Form to Create / Add a New Common Task */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Create Common Task & Assign Completion XP</span>
            </h3>

            <form onSubmit={handleCreateCommonTask} className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-6">
                <label className="text-xs font-bold text-slate-700 block mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newCommonTitle}
                  onChange={(e) => setNewCommonTitle(e.target.value)}
                  placeholder="e.g. Complete security compliance assessment and data privacy policy"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-emerald-500 focus:bg-white"
                />
              </div>

              <div className="md:col-span-3">
                <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={newCommonCategory}
                  onChange={(e) => setNewCommonCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-emerald-500"
                >
                  <option value="HR & Profile">HR & Profile</option>
                  <option value="Legal & HR">Legal & HR</option>
                  <option value="IT Security">IT Security</option>
                  <option value="Team & Culture">Team & Culture</option>
                  <option value="Engineering & Dev">Engineering & Dev</option>
                  <option value="Training & SOP">Training & SOP</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="text-xs font-bold text-slate-700 block mb-1">XP Points Reward</label>
                <div className="flex items-center gap-1.5">
                  <select
                    value={newCommonXp}
                    onChange={(e) => setNewCommonXp(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-900 focus:outline-amber-500 font-mono"
                  >
                    <option value={20}>+20 XP</option>
                    <option value={30}>+30 XP</option>
                    <option value={35}>+35 XP</option>
                    <option value={40}>+40 XP</option>
                    <option value={45}>+45 XP</option>
                    <option value={50}>+50 XP</option>
                    <option value={75}>+75 XP</option>
                    <option value={100}>+100 XP</option>
                  </select>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 shadow-sm"
                  >
                    Add Task
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* List of Existing Common Tasks */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Active Common Tasks ({commonTasks.length})</span>
              </h3>
              <span className="text-xs text-slate-400">
                Automatically created for every new employee
              </span>
            </div>

            {loadingCommonTasks ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading common tasks...</div>
            ) : commonTasks.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No common onboarding tasks configured yet. Use the form above to add tasks.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {commonTasks.map((t, idx) => (
                  <div key={t.id || idx} className="py-3 flex items-center justify-between gap-4 group">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{t.title}</p>
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded mt-0.5 inline-block">
                          {t.category || 'General'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold font-mono flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                        +{t.xp_reward || 35} XP
                      </span>

                      {canOnboard && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCommonTask(t.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete common task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Member Image Upload Modal */}
      {showPhotoModal && selectedUser && (
        <UploadMemberImageModal
          user={selectedUser}
          isOpen={showPhotoModal}
          onClose={() => setShowPhotoModal(false)}
          onSuccess={(updatedUser) => {
            if (selectedUser.id === currentUser?.id && onUpdateCurrentUser) {
              onUpdateCurrentUser(updatedUser);
            }
            if (onRefresh) onRefresh();
            setSelectedUser(prev => ({ ...prev, ...updatedUser }));
          }}
        />
      )}

      {/* Edit Onboarding Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Edit Onboarding Task</h3>
              </div>
              <button 
                onClick={() => setEditingTask(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTask} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Task Description / Title *</label>
                <textarea
                  required
                  rows={3}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-none transition-all font-medium text-slate-800"
                  placeholder="Task title or instructions..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 text-slate-700"
                  >
                    <option value="HR & Profile">HR & Profile</option>
                    <option value="Legal & HR">Legal & HR</option>
                    <option value="IT Security">IT Security</option>
                    <option value="Dev & Tools">Dev & Tools</option>
                    <option value="Training">Training</option>
                    <option value="Culture">Culture</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">XP Reward</label>
                  <select
                    disabled={!isAdmin && !isManager}
                    value={editXpReward}
                    onChange={(e) => setEditXpReward(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-amber-800 focus:outline-emerald-500 disabled:opacity-60"
                  >
                    <option value={20}>+20 XP</option>
                    <option value={30}>+30 XP</option>
                    <option value={35}>+35 XP</option>
                    <option value={40}>+40 XP</option>
                    <option value={50}>+50 XP</option>
                    <option value={75}>+75 XP</option>
                    <option value={100}>+100 XP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 text-slate-700"
                />
              </div>

              {Number(editingTask.xp_claimed) === 1 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>XP reward (+{editingTask.xp_reward} XP) has already been claimed for this milestone. Editing will not re-award XP.</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit || !editTitle.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Candidate Profile Details Modal */}
      {showEditProfileModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white relative">
              <button
                type="button"
                onClick={() => setShowEditProfileModal(false)}
                className="absolute top-5 right-5 p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-emerald-100 text-xs font-semibold mb-2">
                <Edit2 className="w-3.5 h-3.5 text-amber-300" />
                <span>Admin Profile Editor</span>
              </div>
              <h2 className="text-xl font-extrabold tracking-tight">Edit Member Profile</h2>
              <p className="text-emerald-100/90 text-xs mt-1">
                Change full name, designation, department, or contact details.
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editProfileName.trim() || savingCandidateProfile) return;
                try {
                  setSavingCandidateProfile(true);
                  const updated = await api.updateUser(selectedUser.id, {
                    full_name: editProfileName.trim(),
                    designation: editProfileDesignation.trim(),
                    department: editProfileDepartment.trim(),
                    phone: editProfilePhone.trim(),
                    location: editProfileLocation.trim(),
                    actor_name: currentUser?.full_name || 'Admin'
                  });

                  if (selectedUser.id === currentUser?.id && onUpdateCurrentUser) {
                    onUpdateCurrentUser({
                      ...currentUser,
                      full_name: editProfileName.trim(),
                      designation: editProfileDesignation.trim(),
                      department: editProfileDepartment.trim(),
                      phone: editProfilePhone.trim(),
                      location: editProfileLocation.trim()
                    });
                  }

                  setSelectedUser(prev => ({
                    ...prev,
                    full_name: editProfileName.trim(),
                    designation: editProfileDesignation.trim(),
                    department: editProfileDepartment.trim(),
                    phone: editProfilePhone.trim(),
                    location: editProfileLocation.trim()
                  }));

                  if (onRefresh) onRefresh();
                  setShowEditProfileModal(false);
                } catch (err) {
                  alert(err.message || 'Failed to update member profile');
                } finally {
                  setSavingCandidateProfile(false);
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editProfileName}
                  onChange={(e) => setEditProfileName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-emerald-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Job Title / Designation</label>
                  <input
                    type="text"
                    value={editProfileDesignation}
                    onChange={(e) => setEditProfileDesignation(e.target.value)}
                    placeholder="e.g. QA Engineer"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Department</label>
                  <input
                    type="text"
                    value={editProfileDepartment}
                    onChange={(e) => setEditProfileDepartment(e.target.value)}
                    placeholder="e.g. Quality Assurance"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={editProfilePhone}
                    onChange={(e) => setEditProfilePhone(e.target.value)}
                    placeholder="+1 555-0192"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Location / Office</label>
                  <input
                    type="text"
                    value={editProfileLocation}
                    onChange={(e) => setEditProfileLocation(e.target.value)}
                    placeholder="e.g. San Francisco, CA"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  disabled={savingCandidateProfile}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCandidateProfile || !editProfileName.trim()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{savingCandidateProfile ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
