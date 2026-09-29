import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Archive, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  FolderKanban,
  Check
} from 'lucide-react';
import { api } from '../services/api';

export default function DeleteProjectModal({ project, onClose, onDeleted, currentUser }) {
  const [deleteMode, setDeleteMode] = useState('archive'); // 'archive' | 'hard'
  const [confirmName, setConfirmName] = useState('');
  const [confirmedCheck, setConfirmedCheck] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!project) return null;

  const isHardDelete = deleteMode === 'hard';
  const canProceed = !isHardDelete || confirmedCheck;

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!canProceed) return;

    setLoading(true);
    setError('');

    try {
      await api.deleteProject(
        project.id, 
        deleteMode, 
        currentUser?.full_name || 'Admin'
      );
      if (onDeleted) onDeleted(project, deleteMode);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to remove project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp flex flex-col">
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs ${
              isHardDelete ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {isHardDelete ? <Trash2 className="w-5 h-5" /> : <Archive className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {isHardDelete ? 'Permanently Delete Project' : 'Remove / Archive Project'}
              </h2>
              <p className="text-xs text-slate-500">
                Manage project lifecycle and data retention
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleDelete} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Target Project Info */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 font-bold shadow-xs"
              style={{ backgroundColor: project.color || '#10b981' }}
            >
              <FolderKanban className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm truncate">{project.name}</h3>
                <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                  {project.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {project.location_path || (project.project_folder ? `F:/antigravity/${project.project_folder}` : 'No filesystem binding')}
              </p>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 block">
              Choose Removal Method:
            </label>

            {/* Option 1: Soft Archive */}
            <div 
              onClick={() => setDeleteMode('archive')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                deleteMode === 'archive'
                  ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="deleteMode"
                  checked={deleteMode === 'archive'}
                  onChange={() => setDeleteMode('archive')}
                  className="mt-1 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      Archive Project
                    </span>
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Hides the project from active workspace boards and directory views. All tasks, boards, logged hours, and metrics are preserved and can be restored at any time.
                  </p>
                </div>
              </div>
            </div>

            {/* Option 2: Hard Delete */}
            <div 
              onClick={() => setDeleteMode('hard')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                deleteMode === 'hard'
                  ? 'border-rose-500 bg-rose-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="deleteMode"
                  checked={deleteMode === 'hard'}
                  onChange={() => setDeleteMode('hard')}
                  className="mt-1 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      Complete Hard Delete
                    </span>
                    <span className="text-[10px] font-extrabold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200">
                      Permanent Wipe
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Completely and permanently purges this project from the database, cascading deletion to all its execution boards, tasks, and task comments.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 italic">
                    * Local files on your hard drive (e.g. in F:\antigravity) remain untouched on disk.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Hard Delete Safeguard Checkbox */}
          {isHardDelete && (
            <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-2xl space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 text-rose-900 text-xs font-bold">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Irreversible Action Safeguard</span>
              </div>
              <label className="flex items-start gap-2.5 text-xs text-rose-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmedCheck}
                  onChange={(e) => setConfirmedCheck(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 border-rose-300 cursor-pointer"
                />
                <span>
                  I confirm that I want to <strong>permanently hard-delete</strong> "{project.name}" and erase all its boards and tasks forever.
                </span>
              </label>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !canProceed}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2 ${
                isHardDelete
                  ? 'bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-rose-600/20'
                  : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isHardDelete ? (
                <Trash2 className="w-4 h-4" />
              ) : (
                <Archive className="w-4 h-4" />
              )}
              <span>
                {isHardDelete ? 'Hard Delete Project' : 'Archive Project'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
