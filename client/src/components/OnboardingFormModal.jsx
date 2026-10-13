import React, { useState } from 'react';
import { 
  X, 
  Send, 
  CheckCircle2, 
  HelpCircle, 
  Clock, 
  FileText, 
  Trophy, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function OnboardingFormModal({
  isOpen,
  onClose,
  task,
  currentUser,
  onSubmitted,
  readOnly = false
}) {
  const schema = React.useMemo(() => {
    if (!task?.form_schema) return [];
    try {
      return typeof task.form_schema === 'string' 
        ? JSON.parse(task.form_schema) 
        : task.form_schema;
    } catch (e) {
      return [];
    }
  }, [task?.form_schema]);

  const existingSubmission = React.useMemo(() => {
    if (!task?.form_submission) return {};
    try {
      return typeof task.form_submission === 'string'
        ? JSON.parse(task.form_submission)
        : task.form_submission;
    } catch (e) {
      return {};
    }
  }, [task?.form_submission]);

  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setAnswers(existingSubmission || {});
      setError('');
    }
  }, [isOpen, existingSubmission]);

  if (!isOpen || !task) return null;

  const handleFieldChange = (qId, val) => {
    if (readOnly) return;
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (readOnly) return;
    setError('');

    // Verify required fields
    for (const q of schema) {
      if (q.required !== false) {
        const val = answers[q.id || q.label];
        if (!val || (typeof val === 'string' && !val.trim())) {
          setError(`Please answer required question: "${q.label}"`);
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      const res = await api.submitOnboardingForm(
        task.id, 
        answers, 
        currentUser?.full_name || 'Member'
      );
      if (onSubmitted) onSubmitted(res);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit questionnaire');
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitted = !!task.form_submission || Number(task.is_completed) === 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-scaleUp flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50/40 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  {task.title}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {readOnly 
                  ? 'Reviewing employee questionnaire responses' 
                  : 'Please complete all required fields below to submit this onboarding milestone'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* XP Banner */}
          <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl flex items-center justify-between text-xs">
            <span className="font-semibold text-amber-900 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>Milestone Reward:</span>
            </span>
            <span className="font-bold text-amber-800 font-mono">
              +{task.xp_reward || 35} XP
            </span>
          </div>

          {schema.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No specific questions attached to this task.
            </div>
          ) : (
            schema.map((q, idx) => {
              const qKey = q.id || q.label;
              const val = answers[qKey] || '';

              return (
                <div key={q.id || idx} className="space-y-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <label className="text-xs font-bold text-slate-800 block">
                    {idx + 1}. {q.label} {q.required !== false && <span className="text-rose-500">*</span>}
                  </label>

                  {q.type === 'text' && (
                    <input
                      type="text"
                      disabled={readOnly}
                      value={val}
                      onChange={(e) => handleFieldChange(qKey, e.target.value)}
                      placeholder="Enter your response..."
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-emerald-500 font-medium text-slate-800 disabled:bg-slate-100"
                    />
                  )}

                  {q.type === 'textarea' && (
                    <textarea
                      rows={3}
                      disabled={readOnly}
                      value={val}
                      onChange={(e) => handleFieldChange(qKey, e.target.value)}
                      placeholder="Enter your detailed response..."
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-emerald-500 font-medium text-slate-800 resize-none disabled:bg-slate-100"
                    />
                  )}

                  {q.type === 'choice' && (
                    <div className="space-y-2 pt-1">
                      {(q.options || []).map((opt, optIdx) => (
                        <label 
                          key={optIdx} 
                          className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            val === opt 
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold' 
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          } ${readOnly ? 'pointer-events-none' : ''}`}
                        >
                          <input
                            type="radio"
                            name={`q_${qKey}`}
                            value={opt}
                            disabled={readOnly}
                            checked={val === opt}
                            onChange={() => handleFieldChange(qKey, opt)}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Footer Note */}
          <p className="text-[11px] text-slate-400 text-center">
            {readOnly
              ? 'Submitted responses are permanently logged in the audit trail.'
              : 'Once submitted, your manager or administrator will review and verify completion.'}
          </p>

          <div className="pt-2">
            {!readOnly ? (
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{submitting ? 'Submitting Responses...' : 'Submit Questionnaire & Complete Step'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                Close Response Viewer
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
