import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  X, 
  Eye, 
  EyeOff, 
  FileCode, 
  Clock,
  Globe,
  Sparkles,
  Check,
  Save,
  Loader2,
  Database,
  Download
} from 'lucide-react';
import { api } from '../services/api';

const TIMEZONE_OPTIONS = [
  { value: '6', label: 'Asia/Dhaka (UTC+6) — Bangladesh Standard Time' },
  { value: '5.5', label: 'Asia/Kolkata (UTC+5:30) — India Standard Time' },
  { value: '5', label: 'Asia/Karachi (UTC+5) — Pakistan Time' },
  { value: '4', label: 'Asia/Dubai (UTC+4) — Gulf Standard Time' },
  { value: '3', label: 'Asia/Riyadh (UTC+3) — Arabia Standard Time' },
  { value: '1', label: 'Europe/Stockholm (UTC+1) — Central European Time' },
  { value: '0', label: 'UTC / GMT (UTC+0) — Coordinated Universal Time' },
  { value: '-5', label: 'America/New_York (UTC-5) — Eastern Time' },
  { value: '-8', label: 'America/Los_Angeles (UTC-8) — Pacific Time' }
];

export default function AdminSettingsModal({ 
  isOpen, 
  onClose, 
  hideDevFileIndicator, 
  setHideDevFileIndicator,
  currentUser
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [selectedTz, setSelectedTz] = useState('6');
  const [serverTimeInfo, setServerTimeInfo] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await api.getSystemSettings();
        if (res) {
          setSelectedTz(String(res.timezone_offset ?? '6'));
          setServerTimeInfo(res);
        }
      } catch (err) {
        console.warn('Failed to load system settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [isOpen]);

  const handleSaveTimezone = async () => {
    try {
      setSaving(true);
      const opt = TIMEZONE_OPTIONS.find(o => o.value === selectedTz) || { label: `UTC${Number(selectedTz) >= 0 ? '+' : ''}${selectedTz}` };
      const res = await api.updateSystemSettings({
        timezone_offset: parseFloat(selectedTz),
        timezone_label: opt.label,
        actor_name: currentUser?.full_name || 'Admin'
      });
      setSaveSuccess(true);
      setServerTimeInfo(prev => ({
        ...prev,
        timezone_offset: res.timezone_offset,
        timezone_label: res.timezone_label,
        current_server_datetime: res.current_server_datetime
      }));
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      alert(err.message || 'Failed to save timezone setting');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scaleUp"
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
              <p className="text-xs text-slate-500">Global site time, data recording & developer indicators</p>
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
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Section: Global Timezone Settings */}
          <div className="space-y-3 p-4 rounded-xl border border-emerald-200/90 bg-emerald-50/40">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Globe className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-bold text-slate-900">
                  Global System Timezone (UTC Offset)
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                  সার্ভারের সমস্ত তারিখ, টাইমশিট লগ, এবং দৈনিক রেকর্ড এই টাইমজোন অনুযায়ী স্বয়ংক্রিয়ভাবে ক্যালকুলেট ও সেভ হবে।
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 py-3 text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Loading system settings...</span>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Select Timezone:
                  </label>
                  <select
                    value={selectedTz}
                    onChange={(e) => setSelectedTz(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {TIMEZONE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {serverTimeInfo && (
                  <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200/60 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        Current System Time:
                      </span>
                      <span className="font-mono font-bold text-emerald-700">
                        {serverTimeInfo.current_server_datetime || 'Calculating...'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 text-[10px]">
                      <span>Active Setting:</span>
                      <span className="font-semibold text-slate-700">
                        UTC{Number(selectedTz) >= 0 ? `+${selectedTz}` : selectedTz} ({selectedTz === '6' ? 'Bangladesh Time' : 'Custom'})
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleSaveTimezone}
                    disabled={saving}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      saveSuccess
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    }`}
                  >
                    {saving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : saveSuccess ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>{saving ? 'Saving...' : saveSuccess ? 'Timezone Saved!' : 'Save Timezone'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Floating Widgets & UI Helpers
            </span>
            <p className="text-xs text-slate-500 leading-relaxed">
              Configure assistant badges and developer panels displayed in the bottom corners of the workspace.
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

          {/* Database Backup & Snapshot Download */}
          <div className="space-y-1 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Database Maintenance & Backups
            </span>
            <p className="text-xs text-slate-500 leading-relaxed">
              Export and download a complete JSON snapshot of all database tables (users, tasks, projects, logs, settings).
            </p>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200/90 bg-emerald-50/40 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>Export Full Database Backup</span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                      Live Snapshot
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                    Download an offline JSON dump of all tables, relations, and settings.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={downloadingBackup}
                onClick={async () => {
                  try {
                    setDownloadingBackup(true);
                    setBackupSuccess(false);
                    const res = await api.downloadDatabaseBackup();
                    setBackupSuccess(true);
                    setTimeout(() => setBackupSuccess(false), 3000);
                  } catch (err) {
                    alert('Backup download failed: ' + err.message);
                  } finally {
                    setDownloadingBackup(false);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                {downloadingBackup ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : backupSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Downloaded!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Backup</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Notice info */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800">System Time Integration:</span> টাইমজোন পরিবর্তনের সাথে সাথে সার্ভারের ব্যাকএন্ড কুয়েরি এবং ডাটা রেকর্ড নতুন নির্ধারিত টাইম অনুযায়ী কাজ করবে।
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
