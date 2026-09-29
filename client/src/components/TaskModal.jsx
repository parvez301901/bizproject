import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  CheckCircle2, 
  MessageSquare, 
  Trash2,
  AlertCircle,
  Camera,
  Image as ImageIcon,
  Upload,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Plus,
  Eye,
  Edit2
} from 'lucide-react';
import { api } from '../services/api';

export default function TaskModal({ task, users = [], currentUser, onClose, onUpdateTask, onDeleteTask, onOpenLogWork }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState(task?.status || 'To Do');
  const [priority, setPriority] = useState(task?.priority || 'Medium');
  const [dueDate, setDueDate] = useState(task?.due_date || '');
  const [estHours, setEstHours] = useState(task?.estimated_hours || 0);
  const [assignees, setAssignees] = useState(task?.assignee_ids || []);

  // QC Screenshot & Problem Explanation State
  const [qcIssues, setQcIssues] = useState(task?.qc_issues || []);
  const [showAddIssue, setShowAddIssue] = useState(false);
  const [issueTitle, setIssueTitle] = useState('');
  const [issueExplanation, setIssueExplanation] = useState('');
  const [issueSolution, setIssueSolution] = useState('');
  const [issueSeverity, setIssueSeverity] = useState('Major'); // Minor, Major, Blocker
  const [issueImage, setIssueImage] = useState(null);
  const [previewModalImg, setPreviewModalImg] = useState(null);

  useEffect(() => {
    if (task?.id) {
      api.getComments(task.id).then(setComments).catch(console.error);
      setQcIssues(task.qc_issues || []);
    }
  }, [task?.id, task?.qc_issues]);

  if (!task) return null;

  const handleSaveField = (field, value) => {
    onUpdateTask(task.id, { [field]: value });
  };

  // Convert uploaded image file or pasted item to compressed base64
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setIssueImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Capture screen screenshot directly using browser Screen Capture API
  const handleCaptureScreen = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        alert('Screen capture is not supported by your browser. Please take a screenshot and paste (Ctrl+V) or upload it.');
        return;
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" } });
      const track = stream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(track);
      const bitmap = await imageCapture.grabFrame();
      track.stop();

      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0);
      const base64 = canvas.toDataURL('image/png', 0.85);
      setIssueImage(base64);
    } catch (err) {
      console.warn('Screen capture cancelled or error:', err);
    }
  };

  // Support pasting image directly from clipboard (Ctrl+V)
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (event) => {
          setIssueImage(event.target.result);
          setShowAddIssue(true);
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  };

  // Add a new QC problem explanation with cue and notes
  const handleAddQcIssue = (e) => {
    e.preventDefault();
    if (!issueTitle.trim() && !issueExplanation.trim() && !issueImage) return;

    const newIssue = {
      id: 'qc_' + Date.now(),
      title: issueTitle.trim() || 'QC Problem Observation',
      explanation: issueExplanation.trim(),
      solution: issueSolution.trim(),
      severity: issueSeverity,
      image: issueImage,
      status: 'Open', // Open, In Review, Resolved
      created_by: currentUser?.full_name || 'QC Engineer',
      created_at: new Date().toLocaleString()
    };

    const updated = [newIssue, ...qcIssues];
    setQcIssues(updated);
    handleSaveField('qc_issues', updated);

    // Reset form
    setIssueTitle('');
    setIssueExplanation('');
    setIssueSolution('');
    setIssueSeverity('Major');
    setIssueImage(null);
    setShowAddIssue(false);
  };

  const handleToggleIssueStatus = (issueId) => {
    const updated = qcIssues.map(issue => {
      if (issue.id === issueId) {
        const nextStatus = issue.status === 'Resolved' ? 'Open' : 'Resolved';
        return { ...issue, status: nextStatus };
      }
      return issue;
    });
    setQcIssues(updated);
    handleSaveField('qc_issues', updated);
  };

  const handleDeleteIssue = (issueId) => {
    if (!confirm('Remove this QC problem explanation?')) return;
    const updated = qcIssues.filter(i => i.id !== issueId);
    setQcIssues(updated);
    handleSaveField('qc_issues', updated);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const added = await api.addComment(task.id, {
        user_id: 'usr_admin',
        content: newComment.trim()
      });
      setComments(prev => [...prev, added]);
      setNewComment('');
    } catch (err) {
      console.error(err);
    }
  };

  const toggleAssignee = (userId) => {
    const updated = assignees.includes(userId)
      ? assignees.filter(id => id !== userId)
      : [...assignees, userId];
    setAssignees(updated);
    handleSaveField('assignee_ids', updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scaleUp">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 font-semibold">{task.id}</span>
            <span className="text-slate-300">|</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                handleSaveField('status', e.target.value);
              }}
              className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-pointer"
            >
              {['Backlog', 'To Do', 'In Progress', 'In Review', 'Done', 'Blocked'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm('Delete this task?')) {
                  onDeleteTask(task.id);
                  onClose();
                }
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => handleSaveField('title', title)}
              className="w-full text-xl font-bold text-slate-900 border-b border-transparent hover:border-slate-200 focus:border-emerald-500 pb-1 focus:outline-none transition-colors"
              placeholder="Task title..."
            />
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50/80 rounded-xl border border-slate-100">
            {/* Priority */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  handleSaveField('priority', e.target.value);
                }}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-emerald-500"
              >
                {['Low', 'Medium', 'High', 'Urgent'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  handleSaveField('due_date', e.target.value);
                }}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Estimated Hours */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Est. Hours</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={estHours}
                onChange={(e) => setEstHours(e.target.value)}
                onBlur={() => handleSaveField('estimated_hours', Number(estHours) || 0)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Actual Logged Hours & Quick Log Button */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Actual Worked</label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold text-emerald-800 bg-white border border-slate-200 rounded-lg px-2 py-1.5 flex-1">
                  {task.actual_hours || 0} hrs
                </span>
                {onOpenLogWork && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenLogWork(task);
                    }}
                    className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs transition-colors cursor-pointer"
                    title="Log time on this task"
                  >
                    <Clock className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Assignees Selection */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-2">Assign Team Members</label>
            <div className="flex flex-wrap gap-2">
              {users.map(u => {
                const isSelected = assignees.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleAssignee(u.id)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                    }`}
                  >
                    <img
                      src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.full_name}`}
                      alt=""
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span>{u.full_name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-2">Task Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => handleSaveField('description', description)}
              placeholder="Add comprehensive specifications, acceptance criteria, or links..."
              className="w-full text-xs text-slate-700 bg-slate-50/60 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all resize-y"
            />
          </div>

          {/* QC Problem Explanations & Visual Cues Section */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold text-slate-800">
                  QC Problem Explanations & Visual Cues ({qcIssues.length})
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAddIssue(!showAddIssue)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border border-amber-300 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddIssue ? 'Cancel' : 'Add QC Screenshot & Note'}</span>
              </button>
            </div>

            {/* Form to Add New QC Issue */}
            {showAddIssue && (
              <form onSubmit={handleAddQcIssue} onPaste={handlePaste} className="p-4 bg-amber-50/40 rounded-xl border border-amber-200 space-y-3.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-amber-600" />
                    New Visual Problem Explanation
                  </span>
                  <span className="text-[11px] text-amber-700 font-medium">💡 Tip: You can press Ctrl+V anywhere in this form to paste a screenshot!</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Issue / Problem Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Header text overlaps on mobile, Button non-responsive..."
                      value={issueTitle}
                      onChange={(e) => setIssueTitle(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Severity Cue</label>
                    <select
                      value={issueSeverity}
                      onChange={(e) => setIssueSeverity(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 font-medium focus:outline-none focus:border-amber-500"
                    >
                      <option value="Minor">🟢 Minor (Cosmetic)</option>
                      <option value="Major">🟠 Major (Functional Bug)</option>
                      <option value="Blocker">🔴 Blocker (Prevents Release)</option>
                    </select>
                  </div>
                </div>

                {/* Screenshot Uploader / Capture Area */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Visual Evidence (Screenshot / Image)</label>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={handleCaptureScreen}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Take / Capture Screen</span>
                    </button>

                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>Upload Image File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>

                    {issueImage && (
                      <button
                        type="button"
                        onClick={() => setIssueImage(null)}
                        className="text-xs text-rose-600 hover:underline px-2 py-1 cursor-pointer font-medium"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>

                  {issueImage ? (
                    <div className="relative inline-block border-2 border-amber-300 rounded-xl overflow-hidden bg-slate-900 group">
                      <img
                        src={issueImage}
                        alt="Captured issue preview"
                        className="max-h-48 max-w-full rounded-lg object-contain cursor-pointer"
                        onClick={() => setPreviewModalImg(issueImage)}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setPreviewModalImg(issueImage)}
                          className="px-2 py-1 bg-white/90 text-slate-800 text-[11px] font-bold rounded shadow-sm hover:bg-white"
                        >
                          Enlarge
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl text-center bg-slate-50 text-slate-400 text-xs">
                      No screenshot selected yet. Click <b>"Take / Capture Screen"</b>, <b>"Upload Image"</b>, or press <b>Ctrl+V</b> to paste an image.
                    </div>
                  )}
                </div>

                {/* Explanation: What is the problem? */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    🔍 What is the problem? (Detailed QC explanation) *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Explain exactly what went wrong, steps to reproduce, or what is visible in the screenshot..."
                    value={issueExplanation}
                    onChange={(e) => setIssueExplanation(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Solution: What should be done? */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    🎯 What should be done? (Actionable direction for developers)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Instructions or expected design/behavior to fix this problem..."
                    value={issueSolution}
                    onChange={(e) => setIssueSolution(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddIssue(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Save QC Issue & Note
                  </button>
                </div>
              </form>
            )}

            {/* List of Existing QC Issues */}
            <div className="space-y-3">
              {qcIssues.length === 0 ? (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs text-slate-400">
                  No QC problem explanations logged. Click <b>"Add QC Screenshot & Note"</b> above if an issue needs visual cues.
                </div>
              ) : (
                qcIssues.map((issue) => {
                  const isResolved = issue.status === 'Resolved';
                  const sevColor = 
                    issue.severity === 'Blocker' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    issue.severity === 'Major' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-slate-50 text-slate-700 border-slate-200';

                  return (
                    <div
                      key={issue.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isResolved
                          ? 'bg-slate-50/70 border-slate-200 opacity-75'
                          : 'bg-white border-amber-200/80 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleToggleIssueStatus(issue.id)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                              isResolved
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-emerald-50'
                            }`}
                            title="Click to toggle Open / Resolved"
                          >
                            {isResolved ? (
                              <>
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                <span>Resolved</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                <span>Open QC Cue</span>
                              </>
                            )}
                          </button>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${sevColor}`}>
                            {issue.severity || 'Major'}
                          </span>

                          <h5 className={`text-xs font-bold ${isResolved ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                            {issue.title}
                          </h5>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">
                            by {issue.created_by_name || 'QC Reviewer'} • {new Date(issue.created_at).toLocaleDateString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteIssue(issue.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Delete this QC issue"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                        {/* Thumbnail if present */}
                        {issue.image && (
                          <div className="sm:col-span-4 relative group cursor-pointer" onClick={() => setPreviewModalImg(issue.image)}>
                            <img
                              src={issue.image}
                              alt={issue.title}
                              className="w-full h-28 object-cover rounded-lg border border-slate-200 bg-slate-900 group-hover:opacity-90 transition-opacity"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 rounded-lg transition-opacity">
                              <span className="bg-black/80 text-white text-[10px] px-2 py-1 rounded font-semibold flex items-center gap-1">
                                <Eye className="w-3 h-3" /> View Large
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Notes details */}
                        <div className={issue.image ? 'sm:col-span-8 space-y-2' : 'sm:col-span-12 space-y-2'}>
                          <div className="bg-amber-50/40 p-2.5 rounded-lg border border-amber-100 text-xs">
                            <span className="font-bold text-amber-950 block text-[11px] mb-0.5">⚠️ Problem Explanation:</span>
                            <p className="text-slate-700 whitespace-pre-wrap">{issue.explanation}</p>
                          </div>

                          {issue.solution && (
                            <div className="bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100 text-xs">
                              <span className="font-bold text-emerald-950 block text-[11px] mb-0.5">✅ What should be done:</span>
                              <p className="text-slate-700 whitespace-pre-wrap">{issue.solution}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Activity / Comments Stream */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Discussion & Updates ({comments.length})</span>
            </h4>

            {/* List */}
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No comments yet. Start the conversation!</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{c.full_name || 'Team Member'}</span>
                      <span className="text-[10px] text-slate-400">{c.created_at}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add comment input */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Write an update or reply..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Fullsize Screenshot Preview */}
      {previewModalImg && (
        <div 
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn"
          onClick={() => setPreviewModalImg(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden p-2 shadow-2xl flex flex-col items-center">
            <button
              onClick={() => setPreviewModalImg(null)}
              className="absolute top-4 right-4 p-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full transition-colors z-10"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewModalImg}
              alt="QC Issue Preview Fullscreen"
              className="max-h-[85vh] max-w-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
