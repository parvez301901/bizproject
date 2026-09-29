import React, { useState, useEffect, useMemo } from 'react';
import { 
  Megaphone, 
  Send, 
  Users, 
  User, 
  Pin, 
  Trash2, 
  Search, 
  Filter, 
  AlertCircle, 
  Bell, 
  Clock, 
  CheckCircle2, 
  Radio, 
  Plus, 
  Sparkles,
  ShieldAlert,
  Inbox,
  SendHorizontal,
  ChevronDown
} from 'lucide-react';
import { api } from '../services/api';

export default function MessageBoardView({ users = [], currentUser }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all', 'broadcast', 'direct'
  const [selectedRecipientFilter, setSelectedRecipientFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Compose modal/state
  const [showCompose, setShowCompose] = useState(false);
  const [composeRecipientType, setComposeRecipientType] = useState('broadcast'); // 'broadcast' | 'direct'
  const [composeRecipientId, setComposeRecipientId] = useState('');
  const [composeTitle, setComposeTitle] = useState('');
  const [composeContent, setComposeContent] = useState('');
  const [composePriority, setComposePriority] = useState('Normal'); // 'Normal', 'Important', 'Urgent'
  const [composeCategory, setComposeCategory] = useState('Announcement'); // 'Announcement', 'Direct Notice', 'Task Directive', 'Policy Update'
  const [composeIsPinned, setComposeIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  // Fetch messages
  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await api.getMessages({
        user_id: currentUser?.id,
        type: filterType,
        recipient_id: selectedRecipientFilter,
        search: searchQuery
      });
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [filterType, selectedRecipientFilter]);

  // Handle live search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadMessages();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle Submit New Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!composeContent.trim()) {
      setErrorMessage('Please enter message content.');
      return;
    }
    if (composeRecipientType === 'direct' && !composeRecipientId) {
      setErrorMessage('Please select an individual recipient for direct message.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');
      await api.sendMessage({
        sender_id: currentUser?.id || 'usr_admin',
        recipient_type: composeRecipientType,
        recipient_id: composeRecipientType === 'broadcast' ? null : composeRecipientId,
        title: composeTitle,
        content: composeContent,
        priority: composePriority,
        category: composeCategory,
        is_pinned: composeIsPinned ? 1 : 0
      });

      // Reset form & reload
      setComposeTitle('');
      setComposeContent('');
      setComposeRecipientType('broadcast');
      setComposeRecipientId('');
      setComposePriority('Normal');
      setComposeCategory('Announcement');
      setComposeIsPinned(false);
      setShowCompose(false);
      await loadMessages();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePin = async (msgId) => {
    try {
      await api.togglePinMessage(msgId);
      await loadMessages();
    } catch (err) {
      alert(err.message || 'Failed to update pin');
    }
  };

  const handleDelete = async (msgId, title) => {
    if (!confirm(`Are you sure you want to delete message "${title || 'this message'}"?`)) return;
    try {
      await api.deleteMessage(msgId, currentUser?.full_name || 'Admin');
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (err) {
      alert(err.message || 'Failed to delete message');
    }
  };

  // Metrics
  const broadcastCount = useMemo(() => messages.filter(m => m.recipient_type === 'broadcast').length, [messages]);
  const directCount = useMemo(() => messages.filter(m => m.recipient_type === 'direct').length, [messages]);
  const urgentCount = useMemo(() => messages.filter(m => m.priority === 'Urgent' || m.priority === 'Important').length, [messages]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Banner / Hero Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-950 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-emerald-500/20">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial-gradient from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
              <Megaphone className="w-3.5 h-3.5" />
              <span>Enterprise Communications Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Official Message Board
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Broadcast company-wide announcements to all employees, or transmit private direct directives and feedback to individual team members with full audit tracking.
            </p>
          </div>

          {/* Action: Compose Message (Admins can send; all users can view or reply) */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowCompose(!showCompose)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{showCompose ? 'Close Form' : 'Broadcast / Send Message'}</span>
            </button>
          </div>
        </div>

        {/* Quick KPI stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Everyone (Broadcasts)</span>
              <span className="font-bold text-white text-sm">{broadcastCount} Notices</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Individual Direct</span>
              <span className="font-bold text-white text-sm">{directCount} Messages</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 col-span-2 sm:col-span-1">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">High Priority Alerts</span>
              <span className="font-bold text-white text-sm">{urgentCount} Urgent / Important</span>
            </div>
          </div>
        </div>
      </div>

      {/* Message Composer Card (Dropdown / Collapsible) */}
      {showCompose && (
        <div className="bg-white rounded-2xl border border-emerald-200/80 p-5 sm:p-6 shadow-xl animate-fadeIn space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <SendHorizontal className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                New Message Transmission
              </h3>
            </div>
            <span className="text-[11px] text-slate-500">
              Sender: <strong className="text-slate-800">{currentUser?.full_name || 'Administrator'}</strong>
            </span>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="space-y-4">
            {/* Recipient Selector: Broadcast vs Individual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  1. Target Audience *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setComposeRecipientType('broadcast');
                      setComposeRecipientId('');
                    }}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      composeRecipientType === 'broadcast'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Everyone (All)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setComposeRecipientType('direct')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      composeRecipientType === 'direct'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Individual Member</span>
                  </button>
                </div>
              </div>

              {/* Individual Recipient Dropdown (conditional) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  {composeRecipientType === 'direct' ? '2. Select Individual Employee *' : '2. Target Scope'}
                </label>
                {composeRecipientType === 'direct' ? (
                  <select
                    value={composeRecipientId}
                    onChange={(e) => setComposeRecipientId(e.target.value)}
                    required
                    className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="">-- Choose team member --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.designation || u.role} - {u.email})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-500 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>All active employees and team members will receive this broadcast notice.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Subject / Title */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Message Title / Subject *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Q4 Sprint Priorities, System Maintenance Notice, Weekly Check-in..."
                value={composeTitle}
                onChange={(e) => setComposeTitle(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Content Body */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Message Content & Directives *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Write full message details, actionable guidelines, project expectations, or links..."
                value={composeContent}
                onChange={(e) => setComposeContent(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-y leading-relaxed"
              />
            </div>

            {/* Priority, Category, and Pin controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Priority Level</label>
                <select
                  value={composePriority}
                  onChange={(e) => setComposePriority(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-medium focus:outline-none focus:border-emerald-500"
                >
                  <option value="Normal">🟢 Normal</option>
                  <option value="Important">🟠 Important</option>
                  <option value="Urgent">🔴 Urgent</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Category</label>
                <select
                  value={composeCategory}
                  onChange={(e) => setComposeCategory(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-medium focus:outline-none focus:border-emerald-500"
                >
                  <option value="Announcement">📢 Announcement</option>
                  <option value="Direct Notice">📩 Direct Notice</option>
                  <option value="Task Directive">📋 Task Directive</option>
                  <option value="Policy Update">🛡️ Policy Update</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={composeIsPinned}
                    onChange={(e) => setComposeIsPinned(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Pin className="w-3.5 h-3.5 text-amber-500" />
                    Pin to top of board
                  </span>
                </label>
              </div>
            </div>

            {/* Form actions */}
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCompose(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Transmitting...' : 'Send Message'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Filter Tabs: All, Broadcasts, Direct */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              filterType === 'all'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Messages ({messages.length})
          </button>

          <button
            onClick={() => setFilterType('broadcast')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              filterType === 'broadcast'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-600" />
            <span>Broadcasts to Everyone</span>
          </button>

          <button
            onClick={() => setFilterType('direct')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              filterType === 'direct'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <User className="w-3.5 h-3.5 text-sky-600" />
            <span>Individual Member Direct</span>
          </button>
        </div>

        {/* Member dropdown & Search bar */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {filterType === 'direct' && (
            <select
              value={selectedRecipientFilter}
              onChange={(e) => setSelectedRecipientFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Direct Members</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </select>
          )}

          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notices, title, author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* Messages Feed Stream */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Fetching message board communications...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">No Messages Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery 
              ? 'No messages match your search criteria. Try a different keyword.' 
              : 'There are no active messages under this filter. Use the button above to broadcast or send a message.'}
          </p>
          <button
            onClick={() => setShowCompose(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Write First Message</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => {
            const isBroadcast = msg.recipient_type === 'broadcast';
            const isPinned = Boolean(msg.is_pinned);
            const priorityBadge = 
              msg.priority === 'Urgent' ? 'bg-rose-50 text-rose-700 border-rose-200' :
              msg.priority === 'Important' ? 'bg-amber-50 text-amber-800 border-amber-200' :
              'bg-slate-100 text-slate-700 border-slate-200';

            return (
              <div
                key={msg.id}
                className={`bg-white rounded-2xl border transition-all p-5 sm:p-6 shadow-xs relative overflow-hidden ${
                  isPinned 
                    ? 'border-amber-300/80 bg-gradient-to-br from-amber-50/20 via-white to-white' 
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Top Pin Banner */}
                {isPinned && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 to-amber-500 text-slate-900 text-[10px] font-bold px-3 py-0.5 rounded-bl-lg flex items-center gap-1 shadow-xs">
                    <Pin className="w-3 h-3 fill-slate-900" />
                    <span>PINNED ANNOUNCEMENT</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Sender & Recipient Badges */}
                  <div className="flex items-center gap-3">
                    <img
                      src={msg.sender_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender_name || 'Admin'}`}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">
                          {msg.sender_name || 'Administrator'}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                          {msg.sender_role || 'Admin'}
                        </span>
                      </div>

                      {/* Destination label */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <span>to:</span>
                        {isBroadcast ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                            <Radio className="w-3 h-3 text-emerald-600" />
                            Everyone (All Team Members)
                          </span>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 text-[11px]">
                            <img
                              src={msg.recipient_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.recipient_name}`}
                              alt=""
                              className="w-3.5 h-3.5 rounded-full object-cover"
                            />
                            <span>{msg.recipient_name || 'Private Member'}</span>
                            <span className="text-[10px] text-sky-600 font-normal">({msg.recipient_role})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Header Meta: Category, Priority, Date, and Actions */}
                  <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${priorityBadge}`}>
                      {msg.priority}
                    </span>

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                      {msg.category || 'General'}
                    </span>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400 ml-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(msg.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Admin Actions: Pin & Delete */}
                    {isAdmin && (
                      <div className="flex items-center gap-1 pl-2 border-l border-slate-200 ml-1">
                        <button
                          type="button"
                          onClick={() => handleTogglePin(msg.id)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isPinned
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-transparent'
                          }`}
                          title={isPinned ? 'Unpin message' : 'Pin to top'}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(msg.id, msg.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Message Body Content */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  {msg.title && (
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {msg.title}
                    </h4>
                  )}
                  <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
