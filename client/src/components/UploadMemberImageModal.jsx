import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Camera, 
  Check, 
  AlertCircle, 
  Sparkles, 
  RefreshCw, 
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import { api } from '../services/api';

const DICEBEAR_STYLES = [
  'avataaars',
  'bottts',
  'lorelei',
  'micah',
  'notionists',
  'open-peeps',
  'personas'
];

export default function UploadMemberImageModal({
  user,
  isOpen,
  onClose,
  onSuccess
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [mode, setMode] = useState('file'); // 'file' | 'presets' | 'url'
  const [customUrl, setCustomUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen || !user) return null;

  // Process and resize image file to crisp 256x256 base64
  const processImageFile = (file) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP, GIF).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError('Image is too large. Please select an image under 15MB.');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 320;
          canvas.width = maxDim;
          canvas.height = maxDim;
          const ctx = canvas.getContext('2d');

          // Center crop to square
          const minSide = Math.min(img.width, img.height);
          const startX = (img.width - minSide) / 2;
          const startY = (img.height - minSide) / 2;

          ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, maxDim, maxDim);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setPreviewUrl(compressedDataUrl);
          setSelectedFile(file);
        } catch (canvasErr) {
          // Fallback to raw data url if canvas manipulation fails
          setPreviewUrl(e.target.result);
          setSelectedFile(file);
        }
      };
      img.onerror = () => {
        setError('Failed to read image file. Please try another file.');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleApplyPreset = (style) => {
    const seed = `${user.full_name || 'member'}_${Math.random().toString(36).substring(2, 7)}`;
    const url = `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
    setPreviewUrl(url);
    setSelectedFile(null);
  };

  const handleSave = async () => {
    let finalAvatar = previewUrl || (mode === 'url' ? customUrl.trim() : null);

    if (!finalAvatar) {
      setError('Please choose or upload a photo first.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      let updatedUser = null;
      try {
        const res = await api.uploadUserAvatar(user.id, finalAvatar, user.full_name);
        updatedUser = res.user;
      } catch (uploadErr) {
        // Fallback to updateUser endpoint
        const res = await api.updateUser(user.id, {
          avatar_url: finalAvatar,
          actor_name: user.full_name || 'Member'
        });
        updatedUser = res;
      }

      if (onSuccess) {
        onSuccess(updatedUser || { ...user, avatar_url: finalAvatar });
      }
      onClose();
    } catch (err) {
      console.error('Error uploading member image:', err);
      setError(err.message || 'Failed to update member photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentDisplayedAvatar = previewUrl || (mode === 'url' && customUrl ? customUrl : user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.full_name)}`);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp flex flex-col">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-emerald-100 text-xs font-semibold mb-2">
            <Camera className="w-3.5 h-3.5 text-amber-300" />
            <span>Profile Customization</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Upload Member Photo</h2>
          <p className="text-emerald-100/90 text-xs mt-1">
            Personalize your member workspace with your custom photo or stylized avatar.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => { setMode('file'); setError(''); }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'file' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Image</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('presets'); setError(''); }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'presets' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Avatar Presets</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('url'); setError(''); }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'url' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Image URL</span>
            </button>
          </div>

          {/* Live Preview Avatar */}
          <div className="flex items-center justify-center py-2">
            <div className="flex flex-col items-center gap-2">
              <div className="relative group">
                <img
                  src={currentDisplayedAvatar}
                  alt={user.full_name}
                  className="w-24 h-24 rounded-3xl object-cover ring-4 ring-emerald-500/30 shadow-lg bg-emerald-50"
                />
                {previewUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrl('');
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 shadow-sm cursor-pointer"
                    title="Remove selected preview"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <span className="text-[11px] font-medium text-slate-500">
                {previewUrl ? 'New Photo Preview' : 'Current Photo'}
              </span>
            </div>
          </div>

          {/* Tab 1: Upload from local machine */}
          {mode === 'file' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                onChange={handleFileInputChange}
                className="hidden"
                id="member-avatar-file-input"
              />

              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]' 
                    : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  Click to browse or drag and drop your photo
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports PNG, JPG, JPEG, WEBP or GIF (automatically centered & optimized)
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Avatar Presets & Generators */}
          {mode === 'presets' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-medium">
                Choose a stylized team avatar preset:
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {DICEBEAR_STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => handleApplyPreset(style)}
                    className="p-1.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all cursor-pointer flex flex-col items-center gap-1 group"
                  >
                    <img
                      src={`https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(user.full_name)}`}
                      alt={style}
                      className="w-10 h-10 rounded-lg group-hover:scale-105 transition-transform"
                    />
                    <span className="text-[9px] font-semibold text-slate-500 capitalize truncate w-full text-center">
                      {style}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Direct URL */}
          {mode === 'url' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Image Web Address (URL)</label>
              <input
                type="url"
                value={customUrl}
                onChange={(e) => {
                  setCustomUrl(e.target.value);
                  setPreviewUrl(e.target.value);
                }}
                placeholder="https://example.com/my-photo.jpg"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-emerald-500"
              />
              <p className="text-[11px] text-slate-400">
                Direct image links from Unsplash, Google, or any secure HTTPS source.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={loading || (!previewUrl && !customUrl)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-900/10 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Photo...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Member Photo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
