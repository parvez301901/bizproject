import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  FileText, 
  HelpCircle, 
  CheckCircle2, 
  ListOrdered, 
  Sparkles,
  ClipboardList,
  Eye
} from 'lucide-react';

export default function QuestionnaireBuilderModal({
  isOpen,
  onClose,
  initialSchema = [],
  taskTitle = '',
  onSave
}) {
  const [questions, setQuestions] = useState(() => {
    if (Array.isArray(initialSchema) && initialSchema.length > 0) {
      return initialSchema;
    }
    return [
      { id: 'q_1', label: 'Please provide the details or confirmations required:', type: 'textarea', required: true, options: [] }
    ];
  });

  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'

  if (!isOpen) return null;

  const handleAddQuestion = (type = 'text') => {
    const newQ = {
      id: `q_${Date.now()}`,
      label: type === 'choice' ? 'Select appropriate option:' : 'Enter response or answer:',
      type,
      required: true,
      options: type === 'choice' ? ['Yes / Completed', 'Pending / Need Assistance'] : []
    };
    setQuestions(prev => [...prev, newQ]);
  };

  const handleUpdateQuestion = (idx, field, value) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const handleRemoveQuestion = (idx) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddOption = (qIdx) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === qIdx) {
        const opts = q.options || [];
        return { ...q, options: [...opts, `Option ${opts.length + 1}`] };
      }
      return q;
    }));
  };

  const handleUpdateOption = (qIdx, optIdx, val) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === qIdx) {
        const nextOpts = [...(q.options || [])];
        nextOpts[optIdx] = val;
        return { ...q, options: nextOpts };
      }
      return q;
    }));
  };

  const handleRemoveOption = (qIdx, optIdx) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === qIdx) {
        return { ...q, options: (q.options || []).filter((_, oi) => oi !== optIdx) };
      }
      return q;
    }));
  };

  const handleSave = () => {
    const cleaned = questions.filter(q => q.label && q.label.trim());
    onSave(cleaned);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-scaleUp flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50/40 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Configure Onboarding Questionnaire</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Form Builder
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">
                {taskTitle ? `Task: "${taskTitle}"` : 'Attach interactive questions the member must fill to complete this step'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200/80 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'editor' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'preview' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Preview</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'editor' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Questions ({questions.length})
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAddQuestion('text')}
                    className="px-2.5 py-1.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Short Text</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddQuestion('textarea')}
                    className="px-2.5 py-1.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Long Answer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddQuestion('choice')}
                    className="px-2.5 py-1.5 text-[11px] font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Multiple Choice</span>
                  </button>
                </div>
              </div>

              {questions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                  <ClipboardList className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No questions added yet.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Click the buttons above to add short text, long text, or choices.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <div 
                      key={q.id || idx}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 transition-all hover:border-slate-300"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-5 h-5 rounded-md bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={q.label}
                            onChange={(e) => handleUpdateQuestion(idx, 'label', e.target.value)}
                            placeholder="Question label or prompt..."
                            className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-emerald-500 font-semibold text-slate-800"
                          />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={q.type}
                            onChange={(e) => handleUpdateQuestion(idx, 'type', e.target.value)}
                            className="text-[11px] bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none"
                          >
                            <option value="text">Short Text</option>
                            <option value="textarea">Long Answer</option>
                            <option value="choice">Multiple Choice</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Options for choice type */}
                      {q.type === 'choice' && (
                        <div className="pl-7 space-y-2 pt-1 border-t border-slate-200/60">
                          <div className="text-[11px] font-semibold text-slate-600">Selectable Choices:</div>
                          <div className="space-y-1.5">
                            {(q.options || []).map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2">
                                <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 shrink-0" />
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => handleUpdateOption(idx, optIdx, e.target.value)}
                                  className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-md focus:outline-emerald-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOption(idx, optIdx)}
                                  className="text-slate-300 hover:text-rose-500 p-1 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleAddOption(idx)}
                              className="text-[11px] text-emerald-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer pt-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Option</span>
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="pl-7 flex items-center justify-between text-[11px] text-slate-400">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={q.required !== false}
                            onChange={(e) => handleUpdateQuestion(idx, 'required', e.target.checked)}
                            className="rounded text-emerald-600"
                          />
                          <span className="text-slate-600 font-medium">Required field</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Live Form Preview */
            <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded-full">
                  Interactive Preview
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-2">{taskTitle || 'Onboarding Step'}</h4>
                <p className="text-xs text-slate-500">How the employee will see and answer this questionnaire:</p>
              </div>

              {questions.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No questions to preview.</p>
              ) : (
                questions.map((q, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-800 block">
                      {idx + 1}. {q.label} {q.required !== false && <span className="text-rose-500">*</span>}
                    </label>

                    {q.type === 'text' && (
                      <input
                        type="text"
                        disabled
                        placeholder="Type answer here..."
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                      />
                    )}

                    {q.type === 'textarea' && (
                      <textarea
                        disabled
                        rows={2}
                        placeholder="Type detailed response here..."
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl resize-none"
                      />
                    )}

                    {q.type === 'choice' && (
                      <div className="space-y-1.5 pt-1">
                        {(q.options || []).map((opt, optIdx) => (
                          <label key={optIdx} className="flex items-center gap-2 text-xs text-slate-700">
                            <input type="radio" disabled name={`preview_${idx}`} />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save Questionnaire ({questions.length} questions)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
