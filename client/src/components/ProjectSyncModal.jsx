import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  HardDrive,
  FolderSync,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Server,
  Database,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { api } from '../services/api';

export default function ProjectSyncModal({ onClose, onSyncComplete, totalProjects = 0 }) {
  const [syncDirection, setSyncDirection] = useState('local_to_cloud'); // 'local_to_cloud' | 'cloud_to_local'
  const [liveUrl, setLiveUrl] = useState('https://bizproject-api.onrender.com/api');
  const [status, setStatus] = useState('idle'); // 'idle' | 'syncing' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [syncStats, setSyncStats] = useState(null);
  const [scannedDevDirs, setScannedDevDirs] = useState(null);
  const [scanning, setScanning] = useState(false);

  // Quick auto-scan of local folders
  const handleScanLocal = async () => {
    setScanning(true);
    setMessage('');
    try {
      const data = await api.scanLocalProjects();
      setScannedDevDirs(data);
      setMessage(`Discovered ${data.totalDiscovered || 0} local folders in F:/antigravity and C:/xampp/htdocs.`);
    } catch (err) {
      setMessage(err.message || 'Folder scan is available when running local backend.');
    } finally {
      setScanning(false);
    }
  };

  const handleExecuteSync = async () => {
    setStatus('syncing');
    setMessage('Exporting project data bundle...');
    setSyncStats(null);

    try {
      if (syncDirection === 'local_to_cloud') {
        // Step 1: Export from local backend (or current instance)
        const bundle = await api.exportProjectsBundle();
        setMessage(`Bundle prepared with ${bundle.counts.projects} projects. Uploading to live server...`);

        // Step 2: Push to live Cloud backend (Render)
        const res = await api.importProjectsBundle(bundle, liveUrl);
        setSyncStats(res.counts);
        setStatus('success');
        setMessage(res.message || 'Successfully synchronized all projects with the live server!');
      } else {
        // Step 1: Export from live Cloud backend
        setMessage('Downloading latest projects bundle from live Cloud server...');
        const bundle = await api.exportProjectsBundle(liveUrl);
        setMessage(`Downloaded ${bundle.counts.projects} projects. Writing into local database...`);

        // Step 2: Import into current/local backend
        const res = await api.importProjectsBundle(bundle);
        setSyncStats(res.counts);
        setStatus('success');
        setMessage(res.message || 'Successfully updated local database from live cloud server!');
      }

      if (onSyncComplete) onSyncComplete();
    } catch (err) {
      console.error('Sync failed:', err);
      setStatus('error');
      setMessage(err.message || 'Replication failed. Ensure network connection and servers are reachable.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scaleUp flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-slate-50 border-b border-emerald-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <FolderSync className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold mb-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Simultaneous Multi-Environment Sync</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">Manage Projects Across Local & Live Cloud</h2>
              <p className="text-xs text-slate-500">
                Synchronize projects, boards, and workflows seamlessly between localhost and live server.
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

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Status Alert Banner */}
          {message && (
            <div className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 border ${
              status === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : status === 'error'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}>
              {status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : status === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <RefreshCw className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 animate-spin" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{message}</p>
                {syncStats && (
                  <div className="flex gap-4 mt-1.5 text-[11px] text-emerald-700 font-mono">
                    <span>Projects: <b>{syncStats.projectsSynced}</b></span>
                    <span>Boards: <b>{syncStats.boardsSynced}</b></span>
                    <span>Tasks: <b>{syncStats.tasksSynced}</b></span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Direction Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Select Synchronization Flow</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSyncDirection('local_to_cloud')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  syncDirection === 'local_to_cloud'
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  {syncDirection === 'local_to_cloud' && (
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-slate-800 text-xs">Local &rarr; Live Server (Push)</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Upload all local development projects and boards into the live cloud server database.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSyncDirection('cloud_to_local')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  syncDirection === 'cloud_to_local'
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                    <DownloadCloud className="w-4 h-4" />
                  </div>
                  {syncDirection === 'cloud_to_local' && (
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-slate-800 text-xs">Live Server &rarr; Local (Pull)</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Pull latest projects, progress, and edits created on the live server into your local environment.
                </p>
              </button>
            </div>
          </div>

          {/* Endpoint Configurations */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-600" />
                <span>Live Server API URL</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Render / Cloud DB</span>
            </div>
            <input
              type="text"
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              className="w-full text-xs font-mono bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-500">
              Live backend API endpoint where Neon PostgreSQL and Netlify live instances interact.
            </p>
          </div>

          {/* Local Disk Project Inspector */}
          <div className="border border-dashed border-slate-300 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-800">Scan Local Development Directories</h4>
              </div>
              <button
                type="button"
                onClick={handleScanLocal}
                disabled={scanning}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${scanning ? 'animate-spin' : ''}`} />
                <span>{scanning ? 'Scanning...' : 'Scan F: & C: Dirs'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Check unindexed project folders in <code className="text-emerald-700">F:/antigravity</code> and <code className="text-emerald-700">C:/xampp/htdocs</code>.
            </p>

            {scannedDevDirs && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
                <div className="font-semibold text-slate-700 text-[11px]">
                  F:/antigravity ({scannedDevDirs.f_antigravity?.length || 0} folders)
                </div>
                <div className="flex flex-wrap gap-1">
                  {(scannedDevDirs.f_antigravity || []).slice(0, 15).map(f => (
                    <span key={f.name} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-mono">
                      {f.name}
                    </span>
                  ))}
                  {(scannedDevDirs.f_antigravity?.length || 0) > 15 && (
                    <span className="text-[10px] text-slate-400 self-center">
                      +{scannedDevDirs.f_antigravity.length - 15} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleExecuteSync}
            disabled={status === 'syncing'}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${status === 'syncing' ? 'animate-spin' : ''}`} />
            <span>
              {status === 'syncing'
                ? 'Synchronizing...'
                : syncDirection === 'local_to_cloud'
                ? 'Push All to Live Server'
                : 'Pull All from Live Server'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
