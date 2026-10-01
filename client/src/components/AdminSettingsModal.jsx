import React from 'react';
import { 
  Settings, 
  X, 
  Eye, 
  EyeOff, 
  FileCode, 
  HelpCircle, 
  Check, 
  ShieldCheck,
  Layers,
  Sparkles
} from 'lucide-react';

export default function AdminSettingsModal({ 
  isOpen, 
  onClose, 
  hideDevFileIndicator, 
  setHideDevFileIndicator 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">Admin System Settings</h2>
              <p className="text-xs text-slate-500">Interface preferences & developer indicators</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Floating Widgets & UI Helpers
            </span>
            <p className="text-xs text-slate-500 leading-relaxed">
              Configure which assistant badges and developer panels are displayed in the bottom corners of the workspace.
            </p>
          </div>

          {/* Toggle Option: Current File DEV Indicator */}
          <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Current Working File Indicator (DEV Badge)
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                    Shows which file is currently active at the bottom right corner with quick path copying.
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={!hideDevFileIndicator}
                onClick={() => setHideDevFileIndicator(!hideDevFileIndicator)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  !hideDevFileIndicator ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    !hideDevFileIndicator ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Status:</span>
              <span className={`font-semibold flex items-center gap-1 ${
                !hideDevFileIndicator ? 'text-emerald-700' : 'text-slate-500'
              }`}>
                {!hideDevFileIndicator ? (
                  <>
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Visible in Bottom-Right Stack</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                    <span>Hidden</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Quick Notice info */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-[11px] text-emerald-900 leading-relaxed">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Bottom-Right Stack layout:</span> Both the System Help guide and active file inspector now sit together neatly at the bottom-right corner. Turning this off hides the file badge while preserving the Help Guide.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
