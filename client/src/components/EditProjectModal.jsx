import React, { useState } from 'react';
import { 
  X, 
  Settings2, 
  Save, 
  Folder, 
  FileText, 
  Calendar, 
  AlertCircle,
  FolderOpen,
  Server,
  GitBranch,
  Shield,
  EyeOff,
  Eye,
  Trash2,
  Database,
  Code2,
  Cpu,
  HardDrive
} from 'lucide-react';
import { api } from '../services/api';
import DeleteProjectModal from './DeleteProjectModal';

const COLOR_OPTIONS = [
  '#10b981', // emerald
  '#059669', // deep emerald
  '#34d399', // mint
  '#0d9488', // teal-sage
  '#0284c7', // light blue
  '#6366f1', // indigo
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // rose
];

export default function EditProjectModal({ project, onClose, onUpdated, currentUser }) {
  const [name, setName] = useState(project.name || '');
  const [description, setDescription] = useState(project.description || '');
  const [color, setColor] = useState(project.color || '#10b981');
  const [status, setStatus] = useState(project.status || 'active');
  const [priority, setPriority] = useState(project.priority || 'Medium');
  const [startDate, setStartDate] = useState(project.start_date || '');
  const [dueDate, setDueDate] = useState(project.due_date || '');
  const [projectFolder, setProjectFolder] = useState(project.project_folder || '');
  const [docMarkdown, setDocMarkdown] = useState(project.doc_markdown || '');
  const [docPdfPath, setDocPdfPath] = useState(project.doc_pdf_path || '');
  const [progressPercent, setProgressPercent] = useState(
    project.progress_percent !== undefined && project.progress_percent !== null 
      ? project.progress_percent 
      : 0
  );
  const [lifecycleStage, setLifecycleStage] = useState(project.lifecycle_stage || 'Development');
  const [locationPath, setLocationPath] = useState(project.location_path || '');
  const [githubRepo, setGithubRepo] = useState(project.github_repo || '');
  const [serverName, setServerName] = useState(project.server_name || '');
  const [frontendTech, setFrontendTech] = useState(
    project.frontend_tech || (project.tech?.frontend ? project.tech.frontend.join(', ') : '')
  );
  const [backendTech, setBackendTech] = useState(
    project.backend_tech || (project.tech?.backend ? project.tech.backend.join(', ') : '')
  );
  const [databaseTech, setDatabaseTech] = useState(
    project.database_tech || (project.tech?.database ? project.tech.database.join(', ') : '')
  );
  const [techStack, setTechStack] = useState(
    project.tech_stack || (project.tech?.technologies ? project.tech.technologies.join(', ') : '')
  );
  const [isRestricted, setIsRestricted] = useState(project.is_restricted ? true : false);
  const [activeTab, setActiveTab] = useState('general'); // 'general', 'documentation', 'infrastructure', 'tech'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.updateProject(project.id, {
        name: name.trim(),
        description: description.trim(),
        color,
        status,
        priority,
        start_date: startDate || null,
        due_date: dueDate || null,
        project_folder: projectFolder.trim() || null,
        doc_markdown: docMarkdown || null,
        doc_pdf_path: docPdfPath.trim() || null,
        progress_percent: Number(progressPercent) || 0,
        lifecycle_stage: lifecycleStage,
        location_path: locationPath.trim() || null,
        github_repo: githubRepo.trim() || null,
        server_name: serverName.trim() || null,
        frontend_tech: frontendTech.trim() || null,
        backend_tech: backendTech.trim() || null,
        database_tech: databaseTech.trim() || null,
        tech_stack: techStack.trim() || null,
        is_restricted: isRestricted ? 1 : 0,
        actor_name: currentUser?.full_name || 'Admin'
      });
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scaleUp flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-sm"
              style={{ backgroundColor: color }}
            >
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Project Settings & Configuration</h2>
              <p className="text-xs text-slate-500">Edit specs, source paths, GitHub links, server, and employee access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 px-4 sm:px-6 bg-slate-50/40 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            General & Status
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('documentation')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'documentation'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Specifications & Docs (MD / PDF)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('infrastructure')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'infrastructure'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Infrastructure & Access</span>
            {isRestricted && (
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tech')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tech'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Tech Stack & Database</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'general' ? (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Brief Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Objective, revenue target, or customer group..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              {/* Lifecycle Stage & Progress Percent (Determined by Admin) */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                    <span>Lifecycle Phase & Progress %</span>
                    <span className="text-[10px] font-normal text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">Admin Configured</span>
                  </span>
                  <span className="text-sm font-extrabold text-emerald-800 font-mono">
                    {progressPercent}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Current Lifecycle Stage *
                    </label>
                    <select
                      value={lifecycleStage}
                      onChange={(e) => {
                        const newStage = e.target.value;
                        setLifecycleStage(newStage);
                        if (newStage === 'Production' && progressPercent < 100) setProgressPercent(100);
                        if (newStage === 'Testing & QA' && progressPercent < 75) setProgressPercent(80);
                        if (newStage === 'Development' && progressPercent === 0) setProgressPercent(40);
                      }}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 font-medium"
                    >
                      <option value="Ideation & Spec">💡 Ideation & Spec</option>
                      <option value="Development">💻 Development (In Progress)</option>
                      <option value="Testing & QA">🧪 Testing & QA</option>
                      <option value="Staging">🚀 Staging & Pre-Release</option>
                      <option value="Production">🟢 Live in Production</option>
                      <option value="Maintenance">🛠️ Maintenance & Optimization</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Completion Percentage ({progressPercent}%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={progressPercent}
                      onChange={(e) => setProgressPercent(Number(e.target.value))}
                      className="w-full accent-emerald-600 mt-2 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-500 mr-1">Quick Set:</span>
                  {[
                    { label: '0%', val: 0 },
                    { label: '25%', val: 25 },
                    { label: '50%', val: 50 },
                    { label: '75%', val: 75 },
                    { label: '90% (Testing)', val: 90 },
                    { label: '100% (Prod)', val: 100 }
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setProgressPercent(preset.val)}
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium transition-colors cursor-pointer ${
                        progressPercent === preset.val
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  >
                    <option value="active">Active (In Execution)</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  >
                    <option value="Urgent">Urgent 🔥</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Target Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">Accent Color</label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-lg transition-transform cursor-pointer ${
                        color === c ? 'scale-115 ring-2 ring-emerald-500 ring-offset-2' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : activeTab === 'documentation' ? (
            <>
              {/* Linked Folder in F:\antigravity */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Parent Source Folder (in F:\antigravity\)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-slate-100 px-2 py-2 rounded-lg text-slate-500 border border-slate-200">
                    F:\antigravity\
                  </span>
                  <input
                    type="text"
                    value={projectFolder}
                    onChange={(e) => setProjectFolder(e.target.value)}
                    placeholder="e.g. accounting, bizassistant, crm, bizdental..."
                    className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:bg-white font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Connecting a folder enables instant auto-detection of all README, FEATURES, and guide PDF files.
                </p>
              </div>

              {/* PDF Document File Path */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Project Documentation PDF (Relative Path or Filename)
                </label>
                <input
                  type="text"
                  value={docPdfPath}
                  onChange={(e) => setDocPdfPath(e.target.value)}
                  placeholder="e.g. accounting/DEPLOYMENT_AND_USER_GUIDE_BN.pdf"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:bg-white font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Anyone can click the "Overview" button on the project board to view this PDF inside the app or download it.
                </p>
              </div>

              {/* Custom Markdown Documentation / Specs */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Custom Markdown Overview & Feature Roadmap
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Supports GitHub Flavored Markdown</span>
                </div>
                <textarea
                  rows={8}
                  value={docMarkdown}
                  onChange={(e) => setDocMarkdown(e.target.value)}
                  placeholder="# Project Overview&#10;&#10;## Features & Deliverables&#10;- Feature 1: Description&#10;- Feature 2: Description&#10;&#10;## Tech Stack & Architecture..."
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-3 focus:outline-none focus:border-emerald-500 focus:bg-white leading-relaxed"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  If left blank and a folder is specified, the system automatically parses and renders the folder's FEATURES.md or README.md.
                </p>
              </div>
            </>
          ) : (
            /* Infrastructure & Access Tab */
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span>Confidential Infrastructure Information</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  These technical details (local directory path, git origin, server configuration) are hidden from regular employees. Only administrators and project managers can view and configure them.
                </p>
              </div>

              {/* Physical Location Path */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Where Project is Situated (Disk Path)
                </label>
                <input
                  type="text"
                  value={locationPath}
                  onChange={(e) => setLocationPath(e.target.value)}
                  placeholder="e.g. F:/antigravity/whatsappgenie or C:/xampp/htdocs/socialpost"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:bg-white font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Supports any folder in <code className="font-mono text-emerald-700 bg-slate-100 px-1 py-0.5 rounded">F:\antigravity</code> or <code className="font-mono text-emerald-700 bg-slate-100 px-1 py-0.5 rounded">C:\xampp\htdocs</code>
                </p>
              </div>

              {/* GitHub Link */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  GitHub Repository Link
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={githubRepo}
                    onChange={(e) => setGithubRepo(e.target.value)}
                    placeholder="https://github.com/organization/repository.git"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-emerald-500 focus:bg-white font-mono"
                  />
                  <GitBranch className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Server Name / Environment */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Server Name / Runtime Environment
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
                    placeholder="e.g. PHP / Apache (XAMPP localhost) or Next.js (Node port 3000) or Laravel"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                  <Server className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Access Control: Hide this project from employees */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRestricted}
                    onChange={(e) => setIsRestricted(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>Hide entire project from employees</span>
                      {isRestricted ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">Confidential</span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded">Public to Team</span>
                      )}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      When checked, this project is completely hidden from employee accounts. Only admins and managers will see it on their dashboard and projects directory.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'tech' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex items-start gap-2.5">
                <Cpu className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-900 leading-relaxed">
                  Specify or customize the technology stack used in this project. If left empty, Apex Board automatically scans <code className="font-mono bg-emerald-100/70 px-1 py-0.5 rounded">package.json</code>, <code className="font-mono bg-emerald-100/70 px-1 py-0.5 rounded">composer.json</code>, and disk files.
                </p>
              </div>

              {/* Frontend UI */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-sky-500" />
                  <span>Frontend UI / Libraries</span>
                </label>
                <input
                  type="text"
                  value={frontendTech}
                  onChange={(e) => setFrontendTech(e.target.value)}
                  placeholder="e.g. React, Next.js, Vite, Tailwind CSS, Vue"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">Comma-separated client frameworks and styling tools.</p>
              </div>

              {/* Backend Engine */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Backend Engine / Frameworks</span>
                </label>
                <input
                  type="text"
                  value={backendTech}
                  onChange={(e) => setBackendTech(e.target.value)}
                  placeholder="e.g. Node.js, Express, PHP, Laravel, Python, FastAPI"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">Comma-separated server runtimes, REST frameworks, or microservices.</p>
              </div>

              {/* Database */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Database & Storage</span>
                </label>
                <input
                  type="text"
                  value={databaseTech}
                  onChange={(e) => setDatabaseTech(e.target.value)}
                  placeholder="e.g. PostgreSQL, SQLite, MySQL, MongoDB, Redis"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">Primary database, cache layer, or persistent storage engines.</p>
              </div>

              {/* Additional Technologies */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Other Tooling, ORM, or DevOps (Optional)
                </label>
                <input
                  type="text"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  placeholder="e.g. TypeScript, Prisma, Docker, Socket.io"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* Footer Submit Buttons and Danger Zone */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
            <div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                title="Archive or permanently hard-delete this project"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Project...</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{loading ? 'Saving Changes...' : 'Save Project Settings'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Delete / Archive Confirmation Dialog */}
      {showDeleteModal && (
        <DeleteProjectModal
          project={project}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={async () => {
            setShowDeleteModal(false);
            onClose();
            if (onUpdated) onUpdated();
          }}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
