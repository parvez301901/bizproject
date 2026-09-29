import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Video, 
  Upload, 
  Link as LinkIcon, 
  Users, 
  Globe, 
  Lock, 
  Play, 
  Trash2, 
  Search, 
  Filter, 
  Plus, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  FileVideo, 
  Eye, 
  ShieldCheck,
  ChevronDown,
  Layers,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

export default function InstructionVideosView({ users = [], currentUser }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterAudience, setFilterAudience] = useState('all'); // 'all', 'open', 'restricted'

  // Modal / Compose State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [videoMode, setVideoMode] = useState('file'); // 'file' | 'url'
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Training & SOP');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileBase64, setFileBase64] = useState('');
  const [audienceType, setAudienceType] = useState('all'); // 'all' (open for all) | 'selected' (particular people)
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Video Player Modal
  const [playingVideo, setPlayingVideo] = useState(null);

  const fileInputRef = useRef(null);
  const isAdmin = currentUser?.role === 'admin';

  // Load videos
  const loadVideos = async () => {
    try {
      setLoading(true);
      const data = await api.getVideos({
        user_id: currentUser?.id,
        category: filterCategory,
        search: searchQuery
      });
      setVideos(data || []);
    } catch (err) {
      console.error('Failed to load instruction videos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, [filterCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadVideos();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle file select
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file (MP4, WebM, MOV, etc.)');
      return;
    }

    // Limit check for client base64 reading (e.g. 50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      alert('Selected video file is larger than 50MB. Please consider a smaller clip or provide a direct video URL.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setFileBase64(loadEvt.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Toggle user selection for restricted audience
  const toggleUserSelection = (userId) => {
    setSelectedUserIds(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Submit new video
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a video title.');
      return;
    }

    if (videoMode === 'file' && !fileBase64) {
      setErrorMsg('Please select a video file to upload.');
      return;
    }

    if (videoMode === 'url' && !videoUrlInput.trim()) {
      setErrorMsg('Please enter a valid video stream or direct URL.');
      return;
    }

    if (audienceType === 'selected' && selectedUserIds.length === 0) {
      setErrorMsg('Please select at least one particular team member to grant view access.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      await api.uploadVideo({
        uploader_id: currentUser?.id || 'usr_admin',
        title: title.trim(),
        description: description.trim(),
        video_data: videoMode === 'file' ? fileBase64 : null,
        video_url: videoMode === 'url' ? videoUrlInput.trim() : null,
        video_type: videoMode,
        audience_type: audienceType,
        allowed_user_ids: audienceType === 'selected' ? selectedUserIds : [],
        category
      });

      // Reset
      setTitle('');
      setDescription('');
      setVideoUrlInput('');
      setSelectedFile(null);
      setFileBase64('');
      setAudienceType('all');
      setSelectedUserIds([]);
      setShowUploadModal(false);
      await loadVideos();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to publish video');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (videoId, videoTitle) => {
    if (!confirm(`Are you sure you want to delete instruction video "${videoTitle}"?`)) return;
    try {
      await api.deleteVideo(videoId, currentUser?.full_name || 'Admin');
      setVideos(prev => prev.filter(v => v.id !== videoId));
      if (playingVideo?.id === videoId) setPlayingVideo(null);
    } catch (err) {
      alert(err.message || 'Failed to remove video');
    }
  };

  // Filtered list by audience tab
  const displayedVideos = useMemo(() => {
    if (filterAudience === 'all') return videos;
    if (filterAudience === 'open') return videos.filter(v => v.audience_type === 'all');
    if (filterAudience === 'restricted') return videos.filter(v => v.audience_type === 'selected');
    return videos;
  }, [videos, filterAudience]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-emerald-950 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-sky-500/20">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial-gradient from-sky-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold uppercase tracking-wider">
              <Video className="w-3.5 h-3.5" />
              <span>Standard Operating Procedures & Knowledge Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Instruction & Training Videos
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Upload and manage video tutorials, product walkthroughs, architecture diagrams, and onboarding guides with selective audience permissions (open for all employees or reserved for particular people).
            </p>
          </div>

          {/* Action: Upload Video Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Instruction Video</span>
            </button>
          </div>
        </div>

        {/* Quick KPI stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Open For Everyone</span>
              <span className="font-bold text-white text-sm">
                {videos.filter(v => v.audience_type === 'all').length} Public Videos
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Particular Members Only</span>
              <span className="font-bold text-white text-sm">
                {videos.filter(v => v.audience_type === 'selected').length} Targeted Guides
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 col-span-2 sm:col-span-1">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Total SOP Collection</span>
              <span className="font-bold text-white text-sm">{videos.length} Instructional Modules</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Audience Filter Pills */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilterAudience('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              filterAudience === 'all'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Videos ({videos.length})
          </button>

          <button
            onClick={() => setFilterAudience('open')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              filterAudience === 'open'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>Open For All</span>
          </button>

          <button
            onClick={() => setFilterAudience('restricted')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              filterAudience === 'restricted'
                ? 'bg-sky-50 text-sky-800 border border-sky-200 shadow-2xs font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-sky-600" />
            <span>Particular People (Restricted)</span>
          </button>
        </div>

        {/* Category & Search */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="Training & SOP">Training & SOP</option>
            <option value="Architecture & Code">Architecture & Code</option>
            <option value="Product Walkthrough">Product Walkthrough</option>
            <option value="DevOps & Deployments">DevOps & Deployments</option>
            <option value="Security Guidelines">Security Guidelines</option>
          </select>

          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search video guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Videos Grid */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200/80">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading instructional videos library...</p>
        </div>
      ) : displayedVideos.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200/80 space-y-3">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <FileVideo className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Instruction Videos Available</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery 
              ? 'No videos match your search keywords.' 
              : 'There are no instruction videos uploaded yet. Share standard operating procedures or tutorials with your team!'}
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload First Instruction Video</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedVideos.map((video) => {
            const isOpenForAll = video.audience_type === 'all';
            const allowedCount = Array.isArray(video.allowed_user_ids) ? video.allowed_user_ids.length : 0;
            
            return (
              <div 
                key={video.id}
                className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                {/* Video Thumbnail / Preview Area */}
                <div 
                  onClick={() => setPlayingVideo(video)}
                  className="relative aspect-video bg-slate-900 flex items-center justify-center cursor-pointer group-hover:opacity-95 transition-opacity overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />

                  {/* Play Button Icon */}
                  <div className="relative z-20 w-12 h-12 rounded-full bg-emerald-500/90 text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                  </div>

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-xs border border-white/20">
                      {video.category || 'Training & SOP'}
                    </span>

                    {isOpenForAll ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/90 text-slate-950 shadow-xs">
                        <Globe className="w-3 h-3" />
                        <span>Open for All</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/90 text-white shadow-xs">
                        <Lock className="w-3 h-3" />
                        <span>{allowedCount} Selected People</span>
                      </span>
                    )}
                  </div>

                  {/* Bottom Duration / Type */}
                  <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between text-[11px] text-white/90">
                    <span className="truncate max-w-[200px]">
                      Uploaded by {video.uploader_name || 'Admin'}
                    </span>
                    <span className="font-mono text-[10px] bg-white/20 px-1.5 py-0.5 rounded">
                      {video.video_type === 'url' ? 'Direct URL' : 'MP4 File'}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <h3 
                      onClick={() => setPlayingVideo(video)}
                      className="font-bold text-slate-900 text-sm sm:text-base leading-snug group-hover:text-emerald-700 transition-colors cursor-pointer line-clamp-2"
                    >
                      {video.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {video.description || 'Instructional walkthrough and guidance.'}
                    </p>
                  </div>

                  {/* Audience Details Pill */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      {isOpenForAll ? (
                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Visible to whole company
                        </span>
                      ) : (
                        <span className="text-sky-700 font-medium flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-sky-600" />
                          Restricted: {allowedCount} member(s)
                        </span>
                      )}
                    </div>

                    {/* Actions: Watch & Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPlayingVideo(video)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        title="Watch video"
                      >
                        <Play className="w-3 h-3" />
                        <span>Watch</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(video.id, video.title)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete instruction video"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Video Modal Form */}
      {showUploadModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
          onClick={() => setShowUploadModal(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-2xl border border-slate-200/90 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Upload Instruction Video & Set Audience
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Make instruction videos open for all or targeted to specific employees
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUploadSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Video Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PostgreSQL High-Throughput Indexing Guide..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 focus:bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 focus:bg-white font-medium cursor-pointer"
                  >
                    <option value="Training & SOP">Training & SOP</option>
                    <option value="Architecture & Code">Architecture & Code</option>
                    <option value="Product Walkthrough">Product Walkthrough</option>
                    <option value="DevOps & Deployments">DevOps & Deployments</option>
                    <option value="Security Guidelines">Security Guidelines</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Description & Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Outline key takeaways, prerequisites, or timestamps..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 focus:bg-white resize-y"
                />
              </div>

              {/* Video Source Option: Local File vs Direct URL */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <label className="text-xs font-bold text-slate-800 block">
                  Video Source *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVideoMode('file')}
                    className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      videoMode === 'file'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Video File (MP4, WebM)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVideoMode('url')}
                    className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      videoMode === 'url'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Direct Video URL / Stream</span>
                  </button>
                </div>

                {videoMode === 'file' ? (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="video/mp4,video/webm,video/ogg,video/quicktime"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 text-center bg-white cursor-pointer transition-colors"
                    >
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                      {selectedFile ? (
                        <div>
                          <p className="text-xs font-bold text-emerald-800">{selectedFile.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-semibold text-slate-700">Click to choose a video file</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Supports MP4, WebM, MOV (Max 50MB)</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      placeholder="https://example.com/tutorials/demo.mp4 or YouTube / Vimeo direct stream"
                      value={videoUrlInput}
                      onChange={(e) => setVideoUrlInput(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Audience Access Control: Open for All vs Particular People */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 block">
                    Access Permission & Audience *
                  </label>
                  <span className="text-[11px] text-slate-500">Who can watch this video?</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAudienceType('all');
                      setSelectedUserIds([]);
                    }}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      audienceType === 'all'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Open For All (Everyone)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAudienceType('selected')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      audienceType === 'selected'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Select Particular People</span>
                  </button>
                </div>

                {audienceType === 'selected' ? (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">
                        Choose Allowed Team Members ({selectedUserIds.length} selected):
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedUserIds(users.map(u => u.id))}
                        className="text-[11px] text-emerald-700 hover:underline cursor-pointer"
                      >
                        Select All
                      </button>
                    </div>

                    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl bg-white p-2 divide-y divide-slate-100">
                      {users.map(u => {
                        const isChecked = selectedUserIds.includes(u.id);
                        return (
                          <label
                            key={u.id}
                            className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.full_name}`}
                                alt=""
                                className="w-5 h-5 rounded-full object-cover"
                              />
                              <span className="font-medium text-slate-800">{u.full_name}</span>
                              <span className="text-[10px] text-slate-400">({u.designation || u.role})</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleUserSelection(u.id)}
                              className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    🌐 Every employee in the company directory will be able to discover and watch this tutorial.
                  </p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Publishing Video...' : 'Publish Instruction Video'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {playingVideo && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
          onClick={() => setPlayingVideo(null)}
        >
          <div 
            className="bg-slate-900 text-white rounded-2xl w-full max-w-4xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Player Top Bar */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {playingVideo.category}
                </span>
                <h3 className="font-bold text-sm sm:text-base text-white truncate max-w-lg">
                  {playingVideo.title}
                </h3>
              </div>
              <button
                onClick={() => setPlayingVideo(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Screen */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video
                src={playingVideo.video_url}
                controls
                autoPlay
                className="w-full h-full object-contain"
              >
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Video Details Bottom */}
            <div className="p-4 sm:p-5 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <p className="text-slate-300 text-xs leading-relaxed max-w-2xl">
                  {playingVideo.description || 'Instructional walkthrough and guidance.'}
                </p>
                <p className="text-slate-500 text-[11px]">
                  Uploaded by {playingVideo.uploader_name} • {new Date(playingVideo.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {playingVideo.audience_type === 'all' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <Globe className="w-3 h-3" />
                    <span>Open for All</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    <Lock className="w-3 h-3" />
                    <span>Restricted to {Array.isArray(playingVideo.allowed_user_ids) ? playingVideo.allowed_user_ids.length : 0} members</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
