import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FolderKanban, 
  TrendingUp, 
  Sparkles, 
  ArrowUpRight, 
  Trophy, 
  Crown, 
  Award,
  Video,
  Megaphone,
  Calendar,
  Flame,
  UserCheck,
  ChevronRight,
  Camera,
  Upload,
  Edit2,
  X,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import UploadMemberImageModal from './UploadMemberImageModal';

export default function MyOverviewView({
  currentUser,
  stats,
  projects = [],
  onNavigateToTab,
  onOpenLogWork,
  onSelectProject,
  onUpdateCurrentUser
}) {
  const [activeSubTab, setActiveSubTab] = useState('summary');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [newName, setNewName] = useState(currentUser?.full_name || '');
  const [newDesignation, setNewDesignation] = useState(currentUser?.designation || '');
  const [newDepartment, setNewDepartment] = useState(currentUser?.department || '');
  const [savingProfile, setSavingProfile] = useState(false);

  if (!currentUser) return null;

  const currentLevel = currentUser.level || 1;
  const currentXp = currentUser.xp || 0;
  const nextLevelXp = currentLevel * 200;
  const currentLevelBaseXp = (currentLevel - 1) * 200;
  const progressPercent = Math.min(100, Math.round(((currentXp - currentLevelBaseXp) / Math.max(1, nextLevelXp - currentLevelBaseXp)) * 100));

  const totalAssignedProjects = projects.length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* Member Avatar with Interactive Upload Trigger */}
            <div className="relative group shrink-0">
              <img 
                src={currentUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.full_name)}`}
                alt={currentUser.full_name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ring-4 ring-white/30 object-cover shadow-lg bg-emerald-800 transition-transform group-hover:scale-102"
              />
              {/* Overlay hover effect */}
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="absolute inset-0 bg-black/45 hover:bg-black/60 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-[1px]"
                title="Change member photo"
              >
                <Camera className="w-5 h-5 text-white drop-shadow" />
                <span className="text-[10px] font-bold mt-0.5 tracking-tight text-white drop-shadow">Change</span>
              </button>
              {/* Bottom camera badge button */}
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-white text-emerald-800 hover:bg-emerald-50 rounded-full shadow-md flex items-center justify-center cursor-pointer border border-emerald-200 transition-transform hover:scale-110"
                title="Upload Photo"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-700" />
              </button>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-emerald-100 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Team Member Workspace</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Welcome back, {currentUser.full_name}!
                </h1>
                <button
                  type="button"
                  onClick={() => {
                    setNewName(currentUser.full_name || '');
                    setNewDesignation(currentUser.designation || '');
                    setNewDepartment(currentUser.department || '');
                    setShowEditNameModal(true);
                  }}
                  className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white/80 hover:text-white transition-all cursor-pointer border border-white/10"
                  title="Edit my name and title"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-emerald-100/90 text-xs sm:text-sm mt-1">
                {currentUser.designation || 'Team Member'} &bull; {currentUser.department || 'General'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Upload Member Photo Button */}
            <button
              onClick={() => setShowAvatarModal(true)}
              className="px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-xl border border-white/20 transition-all cursor-pointer flex items-center gap-2"
              title="Upload custom member image"
            >
              <Upload className="w-4 h-4 text-emerald-200" />
              <span>Upload Photo</span>
            </button>

            {onOpenLogWork && (
              <button
                onClick={onOpenLogWork}
                className="px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2"
              >
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Log Work Time</span>
              </button>
            )}

            <button
              onClick={() => onNavigateToTab('projects_directory')}
              className="px-4 py-2.5 bg-emerald-500/30 hover:bg-emerald-500/40 text-white text-xs font-semibold rounded-xl border border-white/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <FolderKanban className="w-4 h-4" />
              <span>{totalAssignedProjects > 0 ? 'My Assigned Projects' : 'Projects Catalog'}</span>
            </button>
          </div>
        </div>

        {/* XP & Level Progress Bar */}
        <div className="mt-6 pt-6 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-400 text-amber-950 flex items-center gap-1 shadow-xs">
              <Trophy className="w-3.5 h-3.5 fill-amber-950" />
              Level {currentLevel}
            </span>
            <span className="text-xs text-emerald-100">
              <strong className="text-white font-mono">{currentXp} XP</strong> earned total
            </span>
          </div>

          <div className="flex-1 max-w-md">
            <div className="flex justify-between text-[11px] text-emerald-200 mb-1">
              <span>Progress to Level {currentLevel + 1}</span>
              <span className="font-mono">{progressPercent}%</span>
            </div>
            <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-amber-400 h-full rounded-full transition-all duration-700" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Assigned Projects KPI Card - No project number until admin assigns any project */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Assigned Projects</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${totalAssignedProjects > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                <FolderKanban className="w-4 h-4" />
              </div>
            </div>
            {totalAssignedProjects > 0 ? (
              <>
                <div className="text-2xl font-extrabold text-slate-900">{totalAssignedProjects}</div>
                <p className="text-[11px] text-slate-500 mt-1">Authorized for your team access</p>
              </>
            ) : (
              <>
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/80 text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Pending Assignment
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">No projects assigned yet</p>
              </>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Onboarding Checklist</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{currentUser.onboarding_progress || 0}%</div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${currentUser.onboarding_progress || 0}%` }} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gamification Rank</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">Level {currentLevel}</div>
          <p className="text-[11px] text-slate-500 mt-1">Earn +50 XP per completed task</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Account Standing</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 capitalize">{currentUser.status || 'Active'}</div>
          <p className="text-[11px] text-slate-500 mt-1">Role: <span className="font-semibold text-slate-700 uppercase">Team Member</span></p>
        </div>
      </div>

      {/* Quick Navigation Cards for Team Member */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
          My Team Hubs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            onClick={() => onNavigateToTab('onboarding')}
            className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
              <span>Onboarding Panel</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Complete assigned onboarding tasks, earn bonus XP, and review team handbook.
            </p>
          </div>

          <div 
            onClick={() => onNavigateToTab('messages')}
            className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Megaphone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
              <span>Message Board</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Access company announcements and your personal direct messages securely.
            </p>
          </div>

          <div 
            onClick={() => onNavigateToTab('videos')}
            className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
              <span>Instruction Videos</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Watch training and SOP instruction videos authorized specifically by admin.
            </p>
          </div>
        </div>
      </div>

      {/* Assigned Projects List */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              My Assigned Projects {totalAssignedProjects > 0 ? `(${totalAssignedProjects})` : ''}
            </h2>
            <p className="text-xs text-slate-500">
              {totalAssignedProjects > 0 
                ? 'Projects currently assigned to your team profile by admin.'
                : 'Projects assigned to you by administrators will appear here.'}
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('projects_directory')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
          >
            View Full Catalog &rarr;
          </button>
        </div>

        {totalAssignedProjects === 0 ? (
          <div className="py-12 px-6 text-center rounded-2xl bg-slate-50/70 border border-dashed border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <FolderKanban className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Projects Assigned Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
              Your account is ready. Once an administrator assigns a project to you, your task boards, assignments, and milestones will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => {
                  if (onSelectProject) onSelectProject(proj);
                  onNavigateToTab('project');
                }}
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span 
                      className="w-3 h-3 rounded-full shrink-0" 
                      style={{ backgroundColor: proj.color || '#10b981' }} 
                    />
                    <h3 className="font-bold text-sm text-slate-900 truncate group-hover:text-emerald-700">
                      {proj.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                    {proj.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded font-medium">
                    {proj.lifecycle_stage || 'Development'}
                  </span>
                  <span className="font-mono text-[11px] text-emerald-600 font-semibold">
                    {proj.task_count || 0} tasks
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Member Photo Upload Modal */}
      <UploadMemberImageModal
        user={currentUser}
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onSuccess={(updatedUser) => {
          if (onUpdateCurrentUser) {
            onUpdateCurrentUser(updatedUser);
          }
        }}
      />

      {/* 1-Click Edit Profile & Name Modal */}
      {showEditNameModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white relative">
              <button
                type="button"
                onClick={() => setShowEditNameModal(false)}
                className="absolute top-5 right-5 p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-emerald-100 text-xs font-semibold mb-2">
                <Edit2 className="w-3.5 h-3.5 text-amber-300" />
                <span>My Profile</span>
              </div>
              <h2 className="text-xl font-extrabold tracking-tight">Edit Your Profile</h2>
              <p className="text-emerald-100/90 text-xs mt-1">
                Update your display name, designation, and department.
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newName.trim() || savingProfile) return;
                try {
                  setSavingProfile(true);
                  const updated = await api.updateUser(currentUser.id, {
                    full_name: newName.trim(),
                    designation: newDesignation.trim(),
                    department: newDepartment.trim(),
                    actor_name: newName.trim()
                  });
                  if (onUpdateCurrentUser) {
                    onUpdateCurrentUser({
                      ...currentUser,
                      full_name: newName.trim(),
                      designation: newDesignation.trim(),
                      department: newDepartment.trim()
                    });
                  }
                  setShowEditNameModal(false);
                } catch (err) {
                  alert(err.message || 'Failed to update name');
                } finally {
                  setSavingProfile(false);
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Designation / Role Title</label>
                <input
                  type="text"
                  value={newDesignation}
                  onChange={(e) => setNewDesignation(e.target.value)}
                  placeholder="e.g. VP of Product"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Department</label>
                <input
                  type="text"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  placeholder="e.g. Quality Assurance"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-emerald-500 focus:bg-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditNameModal(false)}
                  disabled={savingProfile}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile || !newName.trim()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{savingProfile ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
