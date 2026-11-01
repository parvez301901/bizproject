import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Download, 
  Edit3, 
  Check, 
  X, 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3, 
  AlignLeft, 
  AlignCenter, 
  Mail, 
  ShieldCheck, 
  AlertCircle,
  Loader2,
  Calendar,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import jsPDF from 'jspdf';

export default function TermsAndConditionsModal({ isOpen, onClose, currentUser }) {
  const [content, setContent] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');
  const [updatedBy, setUpdatedBy] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editHtml, setEditHtml] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Email state for watermark download prompt
  const [promptEmailModal, setPromptEmailModal] = useState(false);
  const [downloadEmail, setDownloadEmail] = useState(currentUser?.email || '');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [emailError, setEmailError] = useState('');

  const editorRef = useRef(null);
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (isOpen) {
      loadTerms();
      if (currentUser?.email) {
        setDownloadEmail(currentUser.email);
      }
    }
  }, [isOpen, currentUser]);

  const loadTerms = async () => {
    try {
      setLoading(true);
      const res = await api.getTermsAndConditions();
      setContent(res.content || '');
      setEditHtml(res.content || '');
      setUpdatedAt(res.updated_at || '');
      setUpdatedBy(res.updated_by || '');
    } catch (err) {
      console.error('Failed to load terms:', err);
    } finally {
      setLoading(false);
    }
  };

  const executeCommand = (cmd, val = null) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(cmd, false, val);
    }
  };

  const handleStartEdit = () => {
    setEditHtml(content);
    setIsEditing(true);
    setSaveSuccess(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditHtml(content);
  };

  const handleSaveEdit = async () => {
    if (!editorRef.current) return;
    const newHtml = editorRef.current.innerHTML;
    try {
      setSaving(true);
      const res = await api.updateTermsAndConditions(newHtml);
      setContent(res.content);
      setEditHtml(res.content);
      setUpdatedAt(res.updated_at);
      setUpdatedBy(res.updated_by);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(err.message || 'Failed to update Terms & Conditions');
    } finally {
      setSaving(false);
    }
  };

  const initiateDownloadPdf = () => {
    if (currentUser?.email) {
      generateWatermarkedPdf(currentUser.email);
    } else {
      setPromptEmailModal(true);
    }
  };

  const handleConfirmEmailDownload = (e) => {
    e.preventDefault();
    if (!downloadEmail || !downloadEmail.includes('@')) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError('');
    setPromptEmailModal(false);
    generateWatermarkedPdf(downloadEmail.trim());
  };

  const generateWatermarkedPdf = (watermarkEmail) => {
    try {
      setDownloadingPdf(true);
      const doc = new jsPDF({
        unit: 'pt',
        format: 'a4',
        orientation: 'portrait'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;
      const contentWidth = pageWidth - (margin * 2);

      // Clean plain text representation
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content || 'Workspace Terms & Conditions';
      
      const elements = Array.from(tempDiv.childNodes);

      let currentY = 70;

      // Draw Header on first page
      doc.setFillColor(16, 185, 129); // Emerald header banner
      doc.rect(0, 0, pageWidth, 8, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('Workspace Terms & Conditions', margin, currentY);
      currentY += 22;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // slate-500
      const formattedDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      });
      doc.text(`Official Compliance & Operating Agreement • Exported: ${formattedDate}`, margin, currentY);
      currentY += 15;

      doc.setDrawColor(226, 232, 240); // slate-200 line
      doc.setLineWidth(1);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 25;

      // Parse structured text blocks
      const blocks = [];
      const traverse = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const txt = node.textContent.trim();
          if (txt) blocks.push({ type: 'text', text: txt });
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const tag = node.tagName.toLowerCase();
          const innerText = node.innerText ? node.innerText.trim() : node.textContent.trim();
          if (!innerText) return;

          if (tag === 'h1' || tag === 'h2') {
            blocks.push({ type: 'heading', level: 1, text: innerText });
          } else if (tag === 'h3' || tag === 'h4') {
            blocks.push({ type: 'subheading', level: 2, text: innerText });
          } else if (tag === 'li') {
            blocks.push({ type: 'list', text: innerText });
          } else if (tag === 'p') {
            blocks.push({ type: 'para', text: innerText });
          } else {
            blocks.push({ type: 'text', text: innerText });
          }
        }
      };

      tempDiv.childNodes.forEach(traverse);

      const renderWatermarkOnPage = () => {
        doc.saveGraphicsState();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(26);
        doc.setTextColor(203, 213, 225); // slate-300 light watermark
        
        // 45 degree angle diagonal watermark repeated across background
        const stampText = `CONFIDENTIAL • ${watermarkEmail.toUpperCase()} • ${formattedDate}`;
        const stampText2 = `LICENSED TO: ${watermarkEmail.toLowerCase()}`;

        // Matrix watermark
        const cx = pageWidth / 2;
        const cy = pageHeight / 2;

        doc.text(stampText, cx, cy - 140, { align: 'center', angle: 35 });
        doc.text(stampText2, cx, cy, { align: 'center', angle: 35 });
        doc.text(stampText, cx, cy + 140, { align: 'center', angle: 35 });

        // Bottom forensic imprint
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(
          `Watermarked copy for authorized recipient: ${watermarkEmail} • Strictly confidential • Do not distribute`,
          pageWidth / 2,
          pageHeight - 20,
          { align: 'center' }
        );

        doc.restoreGraphicsState();
      };

      // Add watermark to Page 1
      renderWatermarkOnPage();

      // Render content blocks
      for (const b of blocks) {
        if (currentY > pageHeight - 60) {
          doc.addPage();
          renderWatermarkOnPage();
          currentY = 50;
        }

        if (b.type === 'heading') {
          currentY += 8;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(13);
          doc.setTextColor(15, 23, 42); // slate-900
          const lines = doc.splitTextToSize(b.text, contentWidth);
          doc.text(lines, margin, currentY);
          currentY += (lines.length * 16) + 6;
        } else if (b.type === 'subheading') {
          currentY += 6;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(30, 41, 59); // slate-800
          const lines = doc.splitTextToSize(b.text, contentWidth);
          doc.text(lines, margin, currentY);
          currentY += (lines.length * 14) + 5;
        } else if (b.type === 'list') {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(51, 65, 85); // slate-700
          const lines = doc.splitTextToSize(`•  ${b.text}`, contentWidth - 10);
          doc.text(lines, margin + 10, currentY);
          currentY += (lines.length * 13) + 3;
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(51, 65, 85); // slate-700
          const lines = doc.splitTextToSize(b.text, contentWidth);
          doc.text(lines, margin, currentY);
          currentY += (lines.length * 13) + 6;
        }
      }

      // Save PDF with sanitized filename
      const cleanEmail = watermarkEmail.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`Workspace_Terms_Conditions_${cleanEmail}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Error generating watermarked PDF: ' + err.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
        {/* Modal Top Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-emerald-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Workspace Terms & Conditions</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Official Policy
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span>Binding workplace and confidentiality standards</span>
                {updatedAt && (
                  <>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar className="w-3 h-3" />
                      Updated {new Date(updatedAt).toLocaleDateString()}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download PDF Button with Watermark */}
            <button
              onClick={initiateDownloadPdf}
              disabled={downloadingPdf || loading}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-emerald-700 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Download watermarked PDF version"
            >
              {downloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              ) : (
                <Download className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span className="hidden sm:inline">Download Watermarked PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>

            {/* Admin WYSIWYG Edit Toggle */}
            {isAdmin && !isEditing && (
              <button
                onClick={handleStartEdit}
                disabled={loading}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Terms (WYSIWYG)</span>
              </button>
            )}

            {isEditing && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer ml-1"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {saveSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Terms & Conditions updated and synced successfully across all workspace members.</span>
          </div>
        )}

        {/* WYSIWYG Toolbar for Admin */}
        {isEditing && (
          <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2 flex items-center flex-wrap gap-1">
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => executeCommand('bold')}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-black cursor-pointer"
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => executeCommand('italic')}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-black cursor-pointer"
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => executeCommand('underline')}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-black cursor-pointer"
                title="Underline"
              >
                <Underline className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-4 w-px bg-slate-300 mx-1" />

            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => executeCommand('formatBlock', '<h2>')}
                className="px-2 py-1 hover:bg-slate-100 rounded text-slate-700 font-bold text-xs cursor-pointer"
                title="Heading 2"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => executeCommand('formatBlock', '<h3>')}
                className="px-2 py-1 hover:bg-slate-100 rounded text-slate-700 font-bold text-xs cursor-pointer"
                title="Heading 3"
              >
                H3
              </button>
              <button
                type="button"
                onClick={() => executeCommand('formatBlock', '<p>')}
                className="px-2 py-1 hover:bg-slate-100 rounded text-slate-700 font-medium text-xs cursor-pointer"
                title="Paragraph"
              >
                Text
              </button>
            </div>

            <div className="h-4 w-px bg-slate-300 mx-1" />

            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => executeCommand('insertUnorderedList')}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
                title="Bullet List"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => executeCommand('insertOrderedList')}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
                title="Numbered List"
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-4 w-px bg-slate-300 mx-1" />

            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => executeCommand('justifyLeft')}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
                title="Align Left"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => executeCommand('justifyCenter')}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
                title="Align Center"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
            </div>

            <span className="text-[11px] text-slate-400 ml-auto italic hidden md:inline">
              WYSIWYG Live Mode: changes preview as you type
            </span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 relative">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-xs font-medium">Loading workspace agreement...</p>
            </div>
          ) : isEditing ? (
            <div className="min-h-[350px]">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: editHtml }}
                className="prose prose-slate max-w-none text-slate-800 text-sm focus:outline-none min-h-[350px] p-4 bg-slate-50/50 rounded-xl border border-dashed border-emerald-400 focus:border-emerald-600 focus:bg-white transition-all"
                style={{ outline: 'none' }}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div 
                className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: content }} 
              />

              {/* Watermark Security Notice at Bottom */}
              <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200/60">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Tamper-Proof Forensic Watermarking</h4>
                    <p className="text-[11px] text-slate-500">
                      When exported as PDF, this document embeds the recipient's authenticated email address across all pages for anti-leak tracking.
                    </p>
                  </div>
                </div>

                <button
                  onClick={initiateDownloadPdf}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download My PDF Copy</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Workspace Policy Active</span>
            {updatedBy && (
              <span className="text-slate-400">&bull; Last modified by {updatedBy}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Email Prompt Modal (if not logged in or wanting specific watermark) */}
      {promptEmailModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Enter Email for Watermarked PDF</h3>
                  <p className="text-[11px] text-slate-500">Required for official document watermark tracking</p>
                </div>
              </div>
              <button
                onClick={() => setPromptEmailModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmEmailDownload} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={downloadEmail}
                  onChange={(e) => {
                    setDownloadEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-emerald-500 focus:bg-white font-medium"
                />
                {emailError && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">{emailError}</p>
                )}
                <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>This address will be forensically imprinted on every page of the generated PDF.</span>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPromptEmailModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Generate & Download</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
