import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Calendar, 
  Check, 
  Sparkles, 
  FolderKanban, 
  ListTodo, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../LanguageContext';

export default function LogWorkModal({ 
  onClose, 
  onLogged, 
  currentUser, 
  projects = [], 
  users = [],
  preselectedTask = null 
}) {
  const { t } = useLanguage();
  const [selectedUserId, setSelectedUserId] = useState(currentUser?.id || 'usr_admin');
  const [projectId, setProjectId] = useState(preselectedTask?.project_id || (projects[0]?.id || ''));
  const [taskId, setTaskId] = useState(preselectedTask?.id || '');
  const [hours, setHours] = useState('2.5');
  const [workDate, setWorkDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numHours = parseFloat(hours);
    if (!numHours || numHours <= 0) {
      setError('Please provide valid hours worked');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a brief description of the work completed');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.logWorkTime({
        user_id: selectedUserId,
        task_id: taskId || null,
        project_id: projectId || null,
        hours: numHours,
        description: description.trim(),
        work_date: workDate,
        actor_name: currentUser?.full_name || 'Admin'
      });
      if (onLogged) onLogged();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit work log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="p-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-600/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t('logWork.title')}</h2>
              <p className="text-xs text-slate-500">{t('logWork.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Employee Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Employee *
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:bg-white font-medium"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.designation || u.role})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Work Date */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {t('logWork.workDate')}
              </label>
              <input
                type="date"
                required
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            {/* Spent Hours */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {t('logWork.hoursSpent')}
              </label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                required
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="e.g. 2.5, 4, 8"
                className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Quick Hours Presets */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 mr-1">Quick Select:</span>
            {['1', '2', '4', '6', '8'].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHours(h)}
                className={`text-[11px] px-2 py-0.5 rounded font-mono transition-colors cursor-pointer ${
                  hours === h
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {h}h
              </button>
            ))}
          </div>

          {/* Project Association */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {t('logWork.relatedProject')}
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:bg-white"
            >
              <option value="">-- {t('logWork.selectProject')} --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Work Summary / Description */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {t('logWork.description')}
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('logWork.descriptionPlaceholder')}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 focus:outline-none focus:border-emerald-500 focus:bg-white leading-relaxed"
            />
          </div>

          {/* Gamification Hint */}
          <div className="p-3 bg-emerald-50/80 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-800 text-xs">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{t('logWork.rewardNotice')}</span>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? t('logWork.saving') : t('logWork.submitBtn')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
