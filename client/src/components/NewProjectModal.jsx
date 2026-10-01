import React, { useState } from 'react';
import { 
  X, 
  FolderPlus, 
  Server, 
  GitBranch, 
  Layers, 
  Calendar, 
  ShieldCheck, 
  HardDrive,
  Sparkles,
  Database,
  Code2,
  Cpu,
  Users,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';

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

const LIFECYCLE_STAGES = [
  'Development',
  'Ideation',
  'Staging',
  'Testing & QA',
  'Production',
  'Maintenance'
];

export default function NewProjectModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#10b981');
  const [priority, setPriority] = useState('Medium');
  const [lifecycleStage, setLifecycleStage] = useState('Development');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [locationPath, setLocationPath] = useState('');
  const [projectFolder, setProjectFolder] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [serverName, setServerName] = useState('');
  const [frontendTech, setFrontendTech] = useState('');
  const [backendTech, setBackendTech] = useState('');
  const [databaseTech, setDatabaseTech] = useState('');
  const [techStack, setTechStack] = useState('');
  const [isRestricted, setIsRestricted] = useState(false);
  const [assignedUserIds, setAssignedUserIds] = useState([]);
  const [allUsersList, setAllUsersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    api.getUsers().then(users => {
      setAllUsersList(users || []);
    }).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.createProject({
        name: name.trim(),
        description: description.trim(),
        color,
        priority,
        lifecycle_stage: lifecycleStage,
        start_date: startDate || null,
        due_date: dueDate || null,
        project_folder: projectFolder.trim() || null,
        location_path: locationPath.trim() || (projectFolder.trim() ? `F:/antigravity/${projectFolder.trim()}` : null),
        github_repo: githubRepo.trim() || null,
        server_name: serverName.trim() || null,
        frontend_tech: frontendTech.trim() || null,
        backend_tech: backendTech.trim() || null,
        database_tech: databaseTech.trim() || null,
        tech_stack: techStack.trim() || null,
        is_restricted: isRestricted ? 1 : 0,
        assigned_user_ids: assignedUserIds
      });
      if (onCreated) onCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-scaleUp flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 rounded-2xl text-white flex items-center justify-center shadow-sm"
              style={{ backgroundColor: color }}
            >
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Create New Project</h2>
              <p className="text-xs text-slate-500">Configure new project workspace, source path, and execution board</p>
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
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Project Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. NextGen LMS, Logistics Portal, Billing Hub..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Primary objective, scope of work, and key deliverables..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Color & Priority Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Lifecycle Stage</label>
              <select
                value={lifecycleStage}
                onChange={(e) => setLifecycleStage(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white cursor-pointer font-medium"
              >
                {LIFECYCLE_STAGES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white cursor-pointer font-medium"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Urgent">Urgent / Critical</option>
              </select>
            </div>
          </div>

          {/* Color Tag Selection */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Theme Brand Color</label>
            <div className="flex items-center flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                    color === c ? 'border-slate-800 scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Source Path & Infrastructure */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
              <span>Filesystem & Infrastructure (Optional)</span>
            </span>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Filesystem Path</label>
              <input
                type="text"
                value={locationPath}
                onChange={(e) => setLocationPath(e.target.value)}
                placeholder="e.g. F:/antigravity/accounting or C:/xampp/htdocs/crm"
                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">GitHub Repo</label>
                <input
                  type="text"
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Dev Server</label>
                <input
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="e.g. Apache XAMPP, Node.js"
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Technology Stack & Architecture Inputs */}
            <div className="pt-2 border-t border-slate-200/80 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                <span>Technology Stack & Architecture (Optional — auto-detected if left empty)</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-1 flex items-center gap-1">
                    <Code2 className="w-3 h-3 text-sky-500" />
                    <span>Frontend UI</span>
                  </label>
                  <input
                    type="text"
                    value={frontendTech}
                    onChange={(e) => setFrontendTech(e.target.value)}
                    placeholder="e.g. React, Next.js, Vite, Tailwind"
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-1 flex items-center gap-1">
                    <Server className="w-3 h-3 text-emerald-600" />
                    <span>Backend Engine</span>
                  </label>
                  <input
                    type="text"
                    value={backendTech}
                    onChange={(e) => setBackendTech(e.target.value)}
                    placeholder="e.g. Node.js, Express, PHP, Laravel"
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-1 flex items-center gap-1">
                    <Database className="w-3 h-3 text-indigo-500" />
                    <span>Database</span>
                  </label>
                  <input
                    type="text"
                    value={databaseTech}
                    onChange={(e) => setDatabaseTech(e.target.value)}
                    placeholder="e.g. PostgreSQL, SQLite, MySQL"
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                  Other Libraries / Tools (comma-separated)
                </label>
                <input
                  type="text"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  placeholder="e.g. TypeScript, Prisma, Redis, Docker"
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 pt-1 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isRestricted}
                onChange={(e) => setIsRestricted(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span>Restricted Access (Hide infrastructure details from regular employees)</span>
            </label>

            {/* Team Member Project Assignment */}
            <div className="pt-2 border-t border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Assign Team Members</span>
                </label>
                <span className="text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                  {assignedUserIds.length} Assigned
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                Grant access to specific team members. (If none selected, visible to all active team members)
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                {allUsersList.map(u => {
                  const isAssigned = assignedUserIds.includes(u.id);
                  return (
                    <button
                      type="button"
                      key={u.id}
                      onClick={() => {
                        setAssignedUserIds(prev => 
                          prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id]
                        );
                      }}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs font-medium border transition-all text-left cursor-pointer ${
                        isAssigned
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.full_name)}`}
                          alt={u.full_name}
                          className="w-5 h-5 rounded-full object-cover shrink-0"
                        />
                        <div className="truncate">
                          <span className="block truncate font-semibold">{u.full_name}</span>
                          <span className="text-[10px] text-slate-400 block truncate">{u.designation || u.role}</span>
                        </div>
                      </div>
                      {isAssigned && (
                        <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 ml-1.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Target Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FolderPlus className="w-4 h-4" />
              )}
              <span>Create Project</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
