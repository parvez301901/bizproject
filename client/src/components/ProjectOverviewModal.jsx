import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  FileDown, 
  ExternalLink, 
  BookOpen, 
  Layers, 
  Calendar, 
  CheckCircle2, 
  Tag, 
  FolderKanban,
  Edit3,
  Sparkles,
  Download,
  AlertTriangle,
  Copy,
  Check,
  Server,
  GitBranch,
  ShieldCheck,
  CheckCircle,
  Database,
  Code2,
  Cpu
} from 'lucide-react';
import { marked } from 'marked';
import { api } from '../services/api';

export default function ProjectOverviewModal({ project, onClose, onEdit, currentUser }) {
  const [projectDetails, setProjectDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('doc'); // 'doc', 'pdf', 'specs'
  const [selectedPdfFile, setSelectedPdfFile] = useState(null);
  const [selectedMdFile, setSelectedMdFile] = useState(null);
  const [currentMarkdown, setCurrentMarkdown] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [docLoading, setDocLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadDetails() {
      if (!project?.id) return;
      try {
        setLoading(true);
        const data = await api.getProject(project.id);
        if (isMounted) {
          setProjectDetails(data);
          setCurrentMarkdown(data.resolvedMarkdown || '');
          
          if (data.resolvedPdf) {
            setSelectedPdfFile(data.resolvedPdf);
          }

          // Check if there are markdown docs in availableDocs
          const mdDocs = (data.availableDocs || []).filter(d => d.type === 'markdown');
          if (mdDocs.length > 0) {
            setSelectedMdFile(mdDocs[0].name);
          }
        }
      } catch (e) {
        console.error('Failed to load project overview:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadDetails();
    return () => { isMounted = false; };
  }, [project?.id]);

  const p = projectDetails || project;
  const pdfUrl = api.getProjectPdfUrl(p.id, selectedPdfFile);
  const renderedHtml = currentMarkdown ? marked.parse(currentMarkdown) : null;
  const canViewInfrastructure = !currentUser || currentUser.role === 'admin' || currentUser.role === 'manager';

  // Handler to load a specific markdown file
  const handleSelectMarkdownFile = async (docName) => {
    setSelectedMdFile(docName);
    try {
      setDocLoading(true);
      const res = await api.getProjectDoc(p.id, docName);
      if (res && res.content) {
        setCurrentMarkdown(res.content);
      }
    } catch (err) {
      console.error('Error fetching doc:', err);
    } finally {
      setDocLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!currentMarkdown) return;
    navigator.clipboard.writeText(currentMarkdown);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!currentMarkdown) return;
    const blob = new Blob([currentMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedMdFile || (p.name + '-specification.md')}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const markdownDocs = (p.availableDocs || []).filter(d => d.type === 'markdown');
  const pdfDocs = (p.availableDocs || []).filter(d => d.type === 'pdf');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col h-[90vh] max-h-[900px]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div 
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
              style={{ backgroundColor: p.color || '#10b981' }}
            >
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center flex-wrap gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{p.name}</h2>
                <span className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  p.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : p.status === 'on_hold'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {p.status ? p.status.toUpperCase() : 'ACTIVE'}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                  {p.lifecycle_stage || 'Development'}
                </span>
                <span className="text-[10px] sm:text-[11px] font-extrabold font-mono bg-slate-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  {p.progress_percent !== undefined ? p.progress_percent : 0}% Complete
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {p.description || 'Enterprise project blueprint and technical architecture specifications'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(p);
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Edit Specs</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Subheader Navigation Tabs & Actions */}
        <div className="flex items-center justify-between px-4 sm:px-6 border-b border-slate-200 bg-slate-50/50 shrink-0 overflow-x-auto gap-4">
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('doc')}
              className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'doc'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Specification & Features (MD)</span>
              {markdownDocs.length > 0 && (
                <span className="text-[10px] bg-slate-200/80 text-slate-700 font-bold px-1.5 py-0.2 rounded-full">
                  {markdownDocs.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('pdf')}
              className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'pdf'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Full Guide & Architecture (PDF)</span>
              {p.resolvedPdf && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('specs')}
              className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'specs'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Directory & Metadata</span>
            </button>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 shrink-0 py-2">
            {activeTab === 'doc' && currentMarkdown && (
              <>
                <button
                  onClick={handleCopyMarkdown}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 hover:text-emerald-700 bg-white border border-slate-200 rounded-md hover:border-emerald-300 transition-colors cursor-pointer"
                  title="Copy markdown text"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy MD</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownloadMarkdown}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 hover:text-emerald-700 bg-white border border-slate-200 rounded-md hover:border-emerald-300 transition-colors cursor-pointer"
                  title="Download Markdown file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              </>
            )}

            {activeTab === 'pdf' && p.resolvedPdf && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-emerald-700 font-semibold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open PDF in Tab</span>
              </a>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
              <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Resolving project documentation & blueprints...</p>
            </div>
          ) : activeTab === 'doc' ? (
            <div className="space-y-4">
              {/* Document File Selector Pills if multiple markdown docs exist */}
              {markdownDocs.length > 0 && (
                <div className="flex items-center flex-wrap gap-1.5 pb-3 border-b border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                    Documents ({markdownDocs.length}):
                  </span>
                  {markdownDocs.map(doc => {
                    const isCurrent = selectedMdFile === doc.name;
                    return (
                      <button
                        key={doc.relativePath}
                        onClick={() => handleSelectMarkdownFile(doc.name)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-emerald-600 text-white shadow-xs font-bold'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <FileText className={`w-3 h-3 ${isCurrent ? 'text-white' : 'text-slate-500'}`} />
                        <span>{doc.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {docLoading ? (
                <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
                  <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">Loading document contents...</span>
                </div>
              ) : renderedHtml ? (
                <div 
                  className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed prose-headings:font-bold prose-headings:text-slate-900 prose-h1:text-xl prose-h2:text-base prose-h3:text-sm prose-p:text-slate-700 prose-li:text-slate-700 prose-table:text-xs prose-th:bg-slate-50 prose-td:border-slate-100 prose-pre:bg-slate-900 prose-pre:text-slate-100 rounded-xl"
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
              ) : (
                <div className="text-center py-16 bg-slate-50/60 border border-dashed border-slate-200 rounded-2xl max-w-lg mx-auto">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-700">No Markdown Documentation Added Yet</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    You can add feature requirements, roadmap, and user stories using the "Edit Specs" button.
                  </p>
                  {onEdit && (
                    <button
                      onClick={() => {
                        onClose();
                        onEdit(p);
                      }}
                      className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Write Specifications
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : activeTab === 'pdf' ? (
            <div className="h-full flex flex-col">
              {p.resolvedPdf ? (
                <div className="h-full flex flex-col space-y-3">
                  {/* If multiple PDFs exist, let user select */}
                  {pdfDocs.length > 1 && (
                    <div className="flex items-center flex-wrap gap-2 pb-2 border-b border-slate-100">
                      <span className="text-xs text-slate-500 font-semibold">Available PDF Guides ({pdfDocs.length}):</span>
                      {pdfDocs.map(doc => (
                        <button
                          key={doc.relativePath}
                          onClick={() => setSelectedPdfFile(doc.relativePath)}
                          className={`text-xs px-2.5 py-1 rounded-md transition-all cursor-pointer font-mono ${
                            selectedPdfFile === doc.relativePath
                              ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {doc.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Inline PDF Viewer Frame */}
                  <div className="flex-1 w-full rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shadow-inner">
                    <iframe
                      src={pdfUrl}
                      title={`${p.name} PDF Overview`}
                      className="w-full h-full border-0"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 bg-slate-50/60 border border-dashed border-slate-200 rounded-2xl max-w-lg mx-auto">
                  <FileDown className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-700">No PDF Guide Attached</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Place any <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">.pdf</code> user guide or technical manual in this project's folder to view it directly here.
                  </p>
                  {onEdit && (
                    <button
                      onClick={() => {
                        onClose();
                        onEdit(p);
                      }}
                      className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Attach PDF Guide
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Specs & Metadata Tab */
            <div className="space-y-6 max-w-3xl">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Project System Metadata</h3>
                  {canViewInfrastructure ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Full Admin Access
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                      Member View
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Project ID</span>
                    <span className="font-mono text-slate-800 font-semibold">{p.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Lifecycle Stage</span>
                    <span className="text-emerald-700 font-semibold">{p.lifecycle_stage || 'Development'}</span>
                  </div>

                  {/* Tech Stack & Architecture Deep Dive */}
                  <div className="col-span-1 sm:col-span-2 p-3.5 bg-gradient-to-br from-slate-50 to-emerald-50/20 border border-slate-200/90 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Technology Stack & Architecture</span>
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        Multi-Tier Specifications
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      {/* Frontend */}
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Code2 className="w-3 h-3 text-sky-500" />
                          <span>Frontend UI</span>
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {p.tech?.frontend && p.tech.frontend.length > 0 ? (
                            p.tech.frontend.map((f) => (
                              <span key={f} className="text-[10px] font-medium bg-sky-50 text-sky-700 border border-sky-200/80 px-1.5 py-0.5 rounded">
                                {f}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Static / Web Interface</span>
                          )}
                        </div>
                      </div>

                      {/* Backend */}
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Server className="w-3 h-3 text-emerald-600" />
                          <span>Backend Engine</span>
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {p.tech?.backend && p.tech.backend.length > 0 ? (
                            p.tech.backend.map((b) => (
                              <span key={b} className="text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-1.5 py-0.5 rounded">
                                {b}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">API / Script Runtime</span>
                          )}
                        </div>
                      </div>

                      {/* Database */}
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Database className="w-3 h-3 text-indigo-500" />
                          <span>Database & Storage</span>
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {p.tech?.database && p.tech.database.length > 0 ? (
                            p.tech.database.map((db) => (
                              <span key={db} className="text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-1.5 py-0.5 rounded">
                                {db}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">File / Central Store</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Additional Tooling & Libraries */}
                    {p.tech?.technologies && p.tech.technologies.length > 0 && (
                      <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold text-slate-500">Tooling & Environment:</span>
                        {p.tech.technologies.map(t => (
                          <span key={t} className="text-[9px] font-mono text-slate-600 bg-slate-200/70 px-1.5 py-0.2 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {canViewInfrastructure && (
                    <div className="col-span-1 sm:col-span-2 p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span>Repository & Deployment Infrastructure</span>
                          <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Confidential / Admin Only
                          </span>
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                        <div>
                          <span className="text-slate-400 block font-medium">Local Path / Situated At:</span>
                          <span className="font-mono text-slate-800 font-medium break-all bg-slate-50 px-2 py-1 rounded block mt-0.5 border border-slate-100">
                            {p.location_path || (p.project_folder ? `F:/antigravity/${p.project_folder}` : 'Not Defined')}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Dev / App Server:</span>
                          <span className="font-semibold text-sky-800 bg-sky-50 px-2 py-1 rounded block mt-0.5 border border-sky-100">
                            {p.server_name || 'Standard Web Server'}
                          </span>
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                          <span className="text-slate-400 block font-medium">GitHub Repository:</span>
                          {p.github_repo ? (
                            <a
                              href={p.github_repo.replace('.git', '')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold hover:underline mt-0.5 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span className="font-mono text-xs">{p.github_repo}</span>
                            </a>
                          ) : (
                            <span className="text-slate-500 italic mt-0.5 block bg-slate-50 px-2 py-1 rounded">
                              Local only (No remote GitHub repository linked)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-400 block font-medium">Start Date</span>
                    <span className="text-slate-800 font-medium">{p.start_date || 'Ongoing'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Target Due Date</span>
                    <span className="text-slate-800 font-medium">{p.due_date || 'Continuous Deployment'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Total Work Items</span>
                    <span className="text-slate-800 font-semibold">{p.task_count || 0} tasks</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Tasks Completed</span>
                    <span className="text-emerald-700 font-bold">{p.completed_task_count || 0} completed</span>
                  </div>
                </div>
              </div>

              {p.availableDocs && p.availableDocs.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Discovered Documents in Project Folder ({p.availableDocs.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {p.availableDocs.map((doc) => (
                      <div 
                        key={doc.relativePath}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {doc.type === 'pdf' ? (
                            <FileDown className="w-4 h-4 text-rose-600 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          <span className="text-xs text-slate-700 font-mono truncate">{doc.name}</span>
                        </div>
                        {doc.type === 'pdf' ? (
                          <a
                            href={api.getProjectPdfUrl(p.id, doc.relativePath)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-emerald-600 font-bold hover:underline shrink-0"
                          >
                            View PDF
                          </a>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveTab('doc');
                              handleSelectMarkdownFile(doc.name);
                            }}
                            className="text-[11px] text-emerald-600 font-bold hover:underline shrink-0 cursor-pointer"
                          >
                            Read Doc
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 truncate max-w-[60%]">
            {p.location_path ? (
              <span>Location: <code className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{p.location_path}</code></span>
            ) : p.project_folder ? (
              <span>Bound to <code className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">F:\antigravity\{p.project_folder}</code></span>
            ) : (
              <span>Central business repository</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
