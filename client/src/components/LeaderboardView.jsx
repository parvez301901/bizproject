import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Medal, 
  Crown, 
  Sparkles, 
  Flame, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  ChevronRight, 
  Search, 
  Filter, 
  Award, 
  Star, 
  Info, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  ShieldCheck,
  ChevronDown,
  Layers,
  HelpCircle
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { api } from '../services/api';

export default function LeaderboardView({ currentUser, onOpenLogWork }) {
  const { t } = useLanguage();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [thresholds, setThresholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [showLadderModal, setShowLadderModal] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await api.getLeaderboard();
      setLeaderboardData(res.leaderboard || []);
      setThresholds(res.levelThresholds || []);
    } catch (e) {
      console.error('Failed to load leaderboard:', e);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique departments for filtering
  const departments = ['all', ...new Set(leaderboardData.map(u => u.department).filter(Boolean))];

  // Filtered leaderboard
  const filteredUsers = leaderboardData.filter(user => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term || 
      user.full_name?.toLowerCase().includes(term) ||
      user.designation?.toLowerCase().includes(term) ||
      user.department?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term);

    const matchesDept = selectedDept === 'all' || user.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const top3 = leaderboardData.slice(0, 3);
  const currentUserEntry = leaderboardData.find(u => u.id === currentUser?.id);

  const getRankBadge = (rank) => {
    if (rank === 1) return { icon: <Crown className="w-5 h-5 text-amber-500 fill-amber-400" />, bg: 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400/40' };
    if (rank === 2) return { icon: <Medal className="w-5 h-5 text-slate-500 fill-slate-300" />, bg: 'bg-slate-100 text-slate-800 border-slate-300 ring-2 ring-slate-300/40' };
    if (rank === 3) return { icon: <Medal className="w-5 h-5 text-amber-700 fill-amber-600" />, bg: 'bg-amber-50 text-amber-900 border-amber-400 ring-2 ring-amber-600/30' };
    return { icon: <span className="font-mono font-bold text-xs">#{rank}</span>, bg: 'bg-slate-100 text-slate-600 border-slate-200' };
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Background glow accents */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -top-10 w-48 h-48 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold backdrop-blur-xs border border-emerald-400/30 mb-3">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('leaderboard.badge')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {t('leaderboard.title')}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-2 leading-relaxed">
            {t('leaderboard.subtitle')} Reach <strong className="text-amber-300">100 XP</strong> for Level 1, <strong className="text-amber-300">500 XP</strong> for Level 2, <strong className="text-amber-300">1,000 XP</strong> for Level 3, and rise to legendary ranks!
          </p>

          {/* Current User Quick Snapshot if available */}
          {currentUserEntry && (
            <div className="mt-4 pt-4 border-t border-emerald-700/50 flex items-center flex-wrap gap-4 text-xs">
              <span className="text-emerald-200">Your Standing:</span>
              <span className="bg-emerald-700/80 px-2.5 py-1 rounded-full font-bold text-white flex items-center gap-1.5 border border-emerald-500/40">
                <span>Rank #{currentUserEntry.rank}</span>
                <span className="text-emerald-300">•</span>
                <span>{currentUserEntry.levelInfo?.title} {currentUserEntry.levelInfo?.badge}</span>
              </span>
              <span className="font-mono font-bold text-amber-300">{currentUserEntry.xp} XP</span>
              <span className="text-emerald-200/80">({currentUserEntry.deltaText})</span>
            </div>
          )}
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowLadderModal(true)}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition-all cursor-pointer flex items-center gap-2 backdrop-blur-xs"
          >
            <Layers className="w-4 h-4 text-emerald-300" />
            <span>Milestone Ladder</span>
          </button>

          {onOpenLogWork && (
            <button
              onClick={onOpenLogWork}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/30 cursor-pointer flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-slate-900 fill-slate-900" />
              <span>Log Work (+20 XP)</span>
            </button>
          )}
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {top3.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>{t('leaderboard.podiumTop')}</span>
            </h2>
            <span className="text-xs text-slate-500">Live Team Rankings</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Rank 2 (Silver) */}
            {top3[1] && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between order-2 md:order-1 relative overflow-hidden group hover:border-slate-300 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-100 rounded-bl-full -mr-6 -mt-6 pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    <Medal className="w-3.5 h-3.5 text-slate-500 fill-slate-400" />
                    <span>#2 Silver</span>
                  </span>
                  <span className="text-xs font-mono font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                    {top3[1].deltaText}
                  </span>
                </div>

                <div className="text-center py-4">
                  <div className="relative inline-block mx-auto mb-3">
                    <img 
                      src={top3[1].avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(top3[1].full_name)}&background=64748b&color=fff`} 
                      alt={top3[1].full_name} 
                      className="w-16 h-16 rounded-2xl object-cover ring-4 ring-slate-200 shadow-md mx-auto"
                    />
                    <span className="absolute -bottom-1 -right-1 text-sm bg-white rounded-full p-0.5 shadow-xs">
                      {top3[1].levelInfo?.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{top3[1].full_name}</h3>
                  <p className="text-xs text-slate-500 truncate max-w-[200px] mx-auto mt-0.5">
                    {top3[1].designation || top3[1].department || 'Team Member'}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                    <span>Level {top3[1].level}</span>
                    <span className="text-slate-400">•</span>
                    <span>{top3[1].levelInfo?.title}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Total XP</span>
                    <span className="font-extrabold font-mono text-slate-900 text-sm">{top3[1].xp} XP</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-slate-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${top3[1].levelInfo?.progressPercent || 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{top3[1].levelInfo?.progressPercent}% progress</span>
                    <span>{top3[1].levelInfo?.xpNeededForNext} XP to Lvl {top3[1].level + 1}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Rank 1 (Gold / Champion) */}
            {top3[0] && (
              <div className="bg-gradient-to-b from-amber-50/50 to-white border-2 border-amber-300 rounded-3xl p-6 shadow-md flex flex-col justify-between order-1 md:order-2 relative overflow-hidden group hover:border-amber-400 transition-all md:-mt-2">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/30 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 shadow-xs border border-amber-300">
                    <Crown className="w-4 h-4 fill-amber-950" />
                    <span>#1 Leader</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {top3[0].deltaText}
                  </span>
                </div>

                <div className="text-center py-5">
                  <div className="relative inline-block mx-auto mb-3">
                    <img 
                      src={top3[0].avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(top3[0].full_name)}&background=f59e0b&color=fff`} 
                      alt={top3[0].full_name} 
                      className="w-20 h-20 rounded-2xl object-cover ring-4 ring-amber-400 shadow-xl mx-auto"
                    />
                    <span className="absolute -bottom-2 -right-1 text-base bg-white rounded-full p-1 shadow-md">
                      {top3[0].levelInfo?.badge}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base">{top3[0].full_name}</h3>
                  <p className="text-xs text-slate-500 font-medium truncate max-w-[220px] mx-auto mt-0.5">
                    {top3[0].designation || top3[0].department || 'Team Member'}
                  </p>
                  <div className="mt-2.5 inline-flex items-center gap-2 text-xs font-extrabold text-amber-900 bg-amber-100/80 px-3.5 py-1 rounded-full border border-amber-200">
                    <span>Level {top3[0].level}</span>
                    <span className="text-amber-400">•</span>
                    <span>{top3[0].levelInfo?.title}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-amber-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-900 font-semibold">Total Experience</span>
                    <span className="font-black font-mono text-amber-900 text-base">{top3[0].xp} XP</span>
                  </div>
                  <div className="w-full bg-amber-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-amber-200/60">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${top3[0].levelInfo?.progressPercent || 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-amber-800/80">
                    <span>{top3[0].levelInfo?.progressPercent}% to Next Level</span>
                    <span>{top3[0].levelInfo?.xpNeededForNext} XP to Lvl {top3[0].level + 1}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Rank 3 (Bronze) */}
            {top3[2] && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between order-3 relative overflow-hidden group hover:border-slate-300 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-6 -mt-6 pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                    <Medal className="w-3.5 h-3.5 text-amber-700 fill-amber-600" />
                    <span>#3 Bronze</span>
                  </span>
                  <span className="text-xs font-mono font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                    {top3[2].deltaText}
                  </span>
                </div>

                <div className="text-center py-4">
                  <div className="relative inline-block mx-auto mb-3">
                    <img 
                      src={top3[2].avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(top3[2].full_name)}&background=d97706&color=fff`} 
                      alt={top3[2].full_name} 
                      className="w-16 h-16 rounded-2xl object-cover ring-4 ring-amber-200 shadow-md mx-auto"
                    />
                    <span className="absolute -bottom-1 -right-1 text-sm bg-white rounded-full p-0.5 shadow-xs">
                      {top3[2].levelInfo?.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{top3[2].full_name}</h3>
                  <p className="text-xs text-slate-500 truncate max-w-[200px] mx-auto mt-0.5">
                    {top3[2].designation || top3[2].department || 'Team Member'}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/50">
                    <span>Level {top3[2].level}</span>
                    <span className="text-amber-400">•</span>
                    <span>{top3[2].levelInfo?.title}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Total XP</span>
                    <span className="font-extrabold font-mono text-slate-900 text-sm">{top3[2].xp} XP</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${top3[2].levelInfo?.progressPercent || 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{top3[2].levelInfo?.progressPercent}% progress</span>
                    <span>{top3[2].levelInfo?.xpNeededForNext} XP to Lvl {top3[2].level + 1}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t('leaderboard.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept === 'all' ? t('leaderboard.allDepartments') : dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Full Leaderboard Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">Rankings & Progression Details</h2>
            <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
              {filteredUsers.length} members
            </span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Ranked by overall experience points
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-16 text-center">{t('leaderboard.rank')}</th>
                <th className="py-3 px-4">{t('leaderboard.employee')}</th>
                <th className="py-3 px-4">{t('leaderboard.level')}</th>
                <th className="py-3 px-4">{t('leaderboard.xp')}</th>
                <th className="py-3 px-4">{t('leaderboard.lead')}</th>
                <th className="py-3 px-4 min-w-[200px]">{t('leaderboard.progressToNext')}</th>
                <th className="py-3 px-4 text-right">Contributions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => {
                const isCurrent = user.id === currentUser?.id;
                const badge = getRankBadge(user.rank);
                const info = user.levelInfo || {};

                return (
                  <tr 
                    key={user.id} 
                    className={`hover:bg-slate-50/80 transition-colors ${isCurrent ? 'bg-emerald-50/60 font-medium' : ''}`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 text-center">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto border transition-all ${badge.bg}`}>
                        {badge.icon}
                      </div>
                    </td>

                    {/* Employee Profile */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=10b981&color=fff`}
                          alt={user.full_name}
                          className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-100"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 truncate">{user.full_name}</span>
                            {isCurrent && (
                              <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 block truncate">
                            {user.designation || user.department || 'Employee'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Level Badge */}
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border"
                        style={{ 
                          backgroundColor: `${info.color || '#10b981'}15`, 
                          borderColor: `${info.color || '#10b981'}40`,
                          color: info.color || '#10b981'
                        }}
                      >
                        <span>{info.badge}</span>
                        <span>Level {user.level}</span>
                        <span className="text-slate-400 font-normal">({info.title})</span>
                      </div>
                    </td>

                    {/* Total XP */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-extrabold text-slate-900 text-sm">
                        {user.xp} <span className="text-xs font-normal text-slate-400">XP</span>
                      </span>
                    </td>

                    {/* Lead / Delta chip */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-mono ${
                        user.deltaType === 'lead'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {user.deltaType === 'lead' ? (
                          <TrendingUp className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-slate-400" />
                        )}
                        <span>{user.deltaText}</span>
                      </span>
                    </td>

                    {/* Progress to Next Level Bar */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-600 font-medium">
                            {info.isMaxLevel ? t('leaderboard.maxLevel') : `${info.progressPercent}% to Lvl ${user.level + 1}`}
                          </span>
                          {!info.isMaxLevel && (
                            <span className="text-slate-400 font-mono">
                              {info.xpNeededForNext} XP left
                            </span>
                          )}
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${info.progressPercent || 0}%`,
                              backgroundColor: info.color || '#10b981'
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Completed tasks & hours */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-700 block text-xs">
                          {user.completed_tasks_count || 0} tasks done
                        </span>
                        <span className="text-[11px] text-slate-400 block font-mono">
                          {user.total_logged_hours || 0} hrs logged
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* How to Earn XP & Milestone Ladder Explanation Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Official XP Leveling Milestones</span>
            </h3>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Active Curve
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            {thresholds.map((tier) => (
              <div 
                key={tier.level}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100/70 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base">{tier.badge}</span>
                  <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded shadow-2xs">
                    {tier.minXp.toLocaleString()} XP
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-800">
                  Level {tier.level}: {tier.title}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {tier.level === 0 ? 'Starter recruit' : `Unlocks at ${tier.minXp} XP`}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How to Earn XP Card */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 border border-emerald-200/80 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-2">
              <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              <span>{t('leaderboard.howToEarn')}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {t('leaderboard.levelLadderDesc')}
            </p>

            <ul className="space-y-2.5 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{t('leaderboard.taskCompleted')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{t('leaderboard.onboardingMilestone')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{t('leaderboard.onboardingGraduation')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{t('leaderboard.workLogging')}</span>
              </li>
            </ul>
          </div>

          {onOpenLogWork && (
            <button
              onClick={onOpenLogWork}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer text-center mt-4"
            >
              Log Daily Work (+20 XP)
            </button>
          )}
        </div>
      </div>

      {/* Milestone Ladder Modal */}
      {showLadderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-scaleUp p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Trophy className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">XP Progression Roadmap</h3>
                  <p className="text-xs text-slate-500">Official leveling milestones across the organization</p>
                </div>
              </div>
              <button
                onClick={() => setShowLadderModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {thresholds.map((tier, idx) => (
                <div 
                  key={tier.level}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{tier.badge}</span>
                    <div>
                      <div className="font-bold text-slate-800 text-xs">
                        Level {tier.level}: {tier.title}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {idx === 0 ? 'Starting tier for new recruits' : `Requires ${tier.minXp.toLocaleString()} total experience points`}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-emerald-700 shadow-2xs">
                    {tier.minXp.toLocaleString()} XP
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowLadderModal(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Close Roadmap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
