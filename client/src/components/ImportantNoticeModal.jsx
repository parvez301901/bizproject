import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Pin, 
  AlertCircle, 
  Radio, 
  User, 
  Megaphone, 
  Clock, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';

export default function ImportantNoticeModal({ isOpen, onClose, currentUser, onOpenMessageBoard }) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchNotices = async () => {
      try {
        setLoading(true);
        const data = await api.getMessages({ user_id: currentUser?.id });
        // Prioritize: 1) pinned notices, 2) Urgent or Important notices, 3) other announcements
        const filtered = (data || []).filter(m => 
          m.is_pinned || 
          m.priority === 'Urgent' || 
          m.priority === 'Important' ||
          m.category === 'Announcement' ||
          m.category === 'Policy Update'
        );
        setNotices(filtered);
      } catch (err) {
        console.error('Failed to fetch important notices:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl border border-slate-200/90 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-emerald-500/5 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 shadow-xs">
              <Bell className="w-5 h-5 fill-amber-500/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
                  Important Company Notices
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  {notices.length} Active
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                Critical announcements, policy shifts, and directives from leadership
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notices Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">Checking leadership notice board...</p>
            </div>
          ) : notices.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">You're All Caught Up!</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No unaddressed urgent directives or pinned announcements at this time.
              </p>
            </div>
          ) : (
            notices.map((notice) => {
              const isPinned = Boolean(notice.is_pinned);
              const isUrgent = notice.priority === 'Urgent';
              const isImportant = notice.priority === 'Important';
              const isBroadcast = notice.recipient_type === 'broadcast';

              const priorityClasses = isUrgent
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : isImportant
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200';

              return (
                <div
                  key={notice.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 relative overflow-hidden ${
                    isUrgent
                      ? 'bg-rose-50/20 border-rose-200 shadow-xs'
                      : isPinned
                      ? 'bg-amber-50/20 border-amber-200/90 shadow-xs'
                      : 'bg-white border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  {/* Top Badge Strip */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {isPinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 shadow-2xs">
                          <Pin className="w-3 h-3 fill-slate-900" />
                          Pinned
                        </span>
                      )}

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${priorityClasses}`}>
                        {notice.priority}
                      </span>

                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                        {notice.category || 'Announcement'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(notice.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Title & Author */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {notice.title || 'General System Notice'}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">by {notice.sender_name || 'Admin'}</span>
                      <span>•</span>
                      <span>Target:</span>
                      {isBroadcast ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
                          <Radio className="w-3 h-3" /> Everyone
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sky-700 font-semibold bg-sky-50 px-1.5 py-0.5 rounded text-[11px]">
                          <User className="w-3 h-3" /> {notice.recipient_name || 'Direct'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Notice Content */}
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-white/70 p-3 rounded-xl border border-slate-100">
                    {notice.content}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              if (onOpenMessageBoard) onOpenMessageBoard();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer hover:underline"
          >
            <Megaphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Open Full Message Board & Transmit</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
