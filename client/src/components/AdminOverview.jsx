import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Users, 
  FolderKanban, 
  TrendingUp, 
  Sparkles, 
  ArrowUpRight, 
  Activity,
  Trophy,
  Crown,
  Medal,
  Zap,
  Layers,
  ChevronRight,
  Bell,
  Settings,
  DollarSign
} from 'lucide-react';
import LeaderboardView from './LeaderboardView';

export default function AdminOverview({ 
  stats, 
  loading = false,
  onNavigateToOnboard, 
  onNavigateToProject,
  onNavigateToLeaderboard,
  onNavigateToEarnings,
  onOpenReward,
  currentUser,
  onOpenLogWork,
  onOpenNotice,
  onOpenSettings
}) {
  const [activeSubView, setActiveSubView] = useState('overview'); // 'overview' | 'leaderboard'

  if (loading || !stats) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
        {/* Top Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2.5">
            <div className="h-6 w-52 bg-slate-200 rounded-full animate-pulse" />
            <div className="h-8 w-80 bg-slate-200 rounded-xl animate-pulse" />
            <div className="h-4 w-96 max-w-full bg-slate-200/80 rounded-md animate-pulse" />
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <div className="h-9 w-36 bg-slate-200 rounded-xl animate-pulse" />
            <div className="h-9 w-44 bg-slate-200 rounded-xl animate-pulse" />
            <div className="h-9 w-32 bg-slate-200 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* KPI Stats Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-24 bg-slate-200 rounded animate-pulse" />
                <div className="w-8 h-8 rounded-lg bg-slate-100 animate-pulse" />
              </div>
              <div className="flex items-baseline gap-2">
                <div className="h-8 w-16 bg-slate-200 rounded-lg animate-pulse" />
                <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
              </div>
              <div className="h-3 w-36 bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Team Leaderboard Snapshot Skeleton */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-100 animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
                <div className="h-3 w-72 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-7 w-36 bg-slate-100 rounded-xl animate-pulse" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-16 bg-slate-200 rounded-full animate-pulse" />
                  <div className="h-5 w-14 bg-slate-200 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 animate-pulse shrink-0" />
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="h-3.5 w-24 bg-slate-200 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
                    <div className="h-3 w-10 bg-slate-100 rounded animate-pulse" />
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Two Distribution Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-4 w-44 bg-slate-200 rounded animate-pulse" />
                <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
              </div>
              <div className="space-y-4 pt-1">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="h-3 w-24 bg-slate-200/80 rounded animate-pulse" />
                      <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full bg-slate-200 animate-pulse w-${(j * 20) + 15}`} style={{ width: `${(5 - j) * 22}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { 
    overview = {}, 
    statusDistribution = [], 
    priorityDistribution = [], 
    recentActivities = [],
    leaderboard = [],
    levelThresholds = []
  } = stats;

  if (activeSubView === 'leaderboard') {
    return (
      <div className="space-y-4">
        <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setActiveSubView('overview')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            ← Back to Operations Center
          </button>
        </div>
        <LeaderboardView currentUser={currentUser} onOpenLogWork={onOpenLogWork} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Executive Operations & Gamification HQ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {currentUser?.role === 'manager' ? 'Management Operations Center' : 'Admin Operations Center'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time telemetry across workspace projects, task velocity, employee XP leveling, and leaderboard standings.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {onOpenReward && (
            <button
              onClick={onOpenReward}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
              title="Reward employee or team member with financial money bonus"
            >
              <DollarSign className="w-4 h-4 text-amber-300" />
              <span>Reward with Money</span>
            </button>
          )}

          {onNavigateToEarnings && (
            <button
              onClick={onNavigateToEarnings}
              className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Earnings Ledger</span>
            </button>
          )}

          <button
            onClick={() => setActiveSubView('leaderboard')}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
          >
            <Trophy className="w-4 h-4 fill-white" />
            <span>Team Leaderboard</span>
          </button>

          <button
            onClick={onNavigateToOnboard}
            className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 transition-colors cursor-pointer"
          >
            Review Onboarding ({overview.onboardingUsers} pending)
          </button>

          {onOpenNotice && (
            <button
              onClick={onOpenNotice}
              className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-300 shadow-2xs transition-all cursor-pointer flex items-center gap-2"
              title="View Important Leadership Notices & Directives"
            >
              <Bell className="w-4 h-4 text-amber-600" />
              <span>Important Notices</span>
            </button>
          )}

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer flex items-center gap-2"
              title="Configure workspace settings & developer indicators"
            >
              <Settings className="w-4 h-4 text-slate-600" />
              <span>Settings</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {/* Total Tasks */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tasks</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{overview.totalTasks}</span>
            <span className="text-xs font-medium text-emerald-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> High Throughput
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Across all active execution boards</p>
        </div>

        {/* Completion Rate */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completion Velocity</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{overview.completionRate}%</span>
            <span className="text-xs text-slate-500">({overview.completedTasks} completed)</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${overview.completionRate}%` }} />
          </div>
        </div>

        {/* Total Personnel */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Team Capacity</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{overview.totalUsers}</span>
            <span className="text-xs text-slate-500">Members</span>
          </div>
          <p className="text-[11px] text-slate-400">Engineering, Design, Strategy</p>
        </div>

        {/* Onboarding in Progress */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Onboarding</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{overview.onboardingUsers}</span>
            <span className="text-xs font-medium text-amber-600">New Hires</span>
          </div>
          <p className="text-[11px] text-slate-400">Checklists & mentorship pending</p>
        </div>

        {/* Financial Rewards Distributed */}
        <div 
          onClick={onNavigateToEarnings}
          className="bg-white border border-emerald-200/90 rounded-2xl p-5 shadow-xs space-y-3 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
          title="Click to view full financial rewards and payout statement"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Rewards Granted</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-700 font-mono">
              ${Number(overview.totalRewardPayout || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>{overview.totalRewardCount || 0} cash payouts</span>
            <span className="text-emerald-700 font-bold group-hover:translate-x-0.5 transition-transform">Ledger &rarr;</span>
          </p>
        </div>
      </div>

      {/* Leaderboard Snapshot Card on Dashboard */}
      {leaderboard && leaderboard.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Leaderboard & XP Milestones</h3>
                <p className="text-xs text-slate-500">Level 1 at 100 XP • Level 2 at 500 XP • Level 3 at 1,000 XP • Level 4 at 2,000 XP</p>
              </div>
            </div>

            <button
              onClick={() => setActiveSubView('leaderboard')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
            >
              <span>View Full Leaderboard</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {leaderboard.slice(0, 4).map((user) => {
              const info = user.levelInfo || {};
              const isFirst = user.rank === 1;

              return (
                <div 
                  key={user.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isFirst 
                      ? 'bg-gradient-to-b from-amber-50/60 to-white border-amber-300 ring-1 ring-amber-300/40 shadow-xs' 
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isFirst ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {isFirst ? <Crown className="w-3 h-3 fill-amber-700 text-amber-700" /> : `#${user.rank}`}
                      <span>Rank #{user.rank}</span>
                    </span>

                    <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {user.xp} XP
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 mb-3">
                    <img
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=10b981&color=fff`}
                      alt={user.full_name}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-white shadow-xs"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 truncate">{user.full_name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{user.designation || user.department}</div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <span>{info.badge}</span>
                        <span>Level {user.level}: {info.title}</span>
                      </span>
                      <span className="text-slate-400 font-mono">{info.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${info.progressPercent || 0}%`,
                          backgroundColor: info.color || '#10b981'
                        }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 text-right">
                      {info.xpNeededForNext} XP to next level
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>Tasks by Workflow Status</span>
            <span className="text-xs font-normal text-slate-400">{overview.totalTasks} items</span>
          </h3>

          <div className="space-y-3">
            {statusDistribution.map((item) => {
              const pct = overview.totalTasks > 0 ? Math.round((item.count / overview.totalTasks) * 100) : 0;
              return (
                <div key={item.status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.status}</span>
                    <span className="text-slate-500">{item.count} tasks ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.status === 'Done' ? 'bg-emerald-600' :
                        item.status === 'In Progress' ? 'bg-emerald-400' :
                        item.status === 'In Review' ? 'bg-blue-400' :
                        item.status === 'To Do' ? 'bg-amber-400' : 'bg-slate-300'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>Workload by Priority Severity</span>
            <span className="text-xs font-normal text-slate-400">Risk Allocation</span>
          </h3>

          <div className="space-y-3">
            {priorityDistribution.map((item) => {
              const pct = overview.totalTasks > 0 ? Math.round((item.count / overview.totalTasks) * 100) : 0;
              return (
                <div key={item.priority} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.priority}</span>
                    <span className="text-slate-500">{item.count} items ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.priority === 'Urgent' ? 'bg-rose-500' :
                        item.priority === 'High' ? 'bg-amber-500' :
                        item.priority === 'Medium' ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
