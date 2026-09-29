import React, { useState, useEffect, useRef } from 'react';
import { 
  CreditCard, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Users, 
  Search, 
  RefreshCw, 
  Trash2, 
  Check, 
  X, 
  UserCheck, 
  Calendar, 
  SlidersHorizontal,
  Flame,
  Radio,
  FileText,
  UserPlus,
  HelpCircle,
  TrendingUp,
  Building,
  KeyRound
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../services/api';

export default function RfidAttendanceView({ users = [], currentUser = {} }) {
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Live RFID Reader tap simulation
  const [rfidInput, setRfidInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState(null);
  const rfidInputRef = useRef(null);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [parseError, setParseError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState(null);

  // Link User Modal State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [targetLog, setTargetLog] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [linking, setLinking] = useState(false);

  // Load Attendance data & daily summary
  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedDate) params.date = selectedDate;
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const [logs, sum] = await Promise.all([
        api.getAttendance(params),
        api.getAttendanceSummary(selectedDate)
      ]);

      setAttendanceLogs(logs || []);
      setSummary(sum || null);
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceData();
  }, [selectedDate, statusFilter]);

  // Handle direct scan/tap
  const handleRfidScanSubmit = async (e) => {
    e.preventDefault();
    if (!rfidInput.trim()) return;

    try {
      setIsScanning(true);
      setLastScanResult(null);

      const res = await api.scanRfidCard({
        rfid_card: rfidInput.trim(),
        terminal_id: 'READER-DESK-01'
      });

      setLastScanResult({
        success: true,
        type: res.type,
        message: res.message,
        card: rfidInput.trim(),
        user: res.user
      });
      setRfidInput('');
      loadAttendanceData();

      // Audio cue simulation / notification
      if (window.navigator?.vibrate) {
        window.navigator.vibrate(100);
      }
    } catch (err) {
      setLastScanResult({
        success: false,
        message: err.message || 'Error scanning RFID card'
      });
    } finally {
      setIsScanning(false);
      if (rfidInputRef.current) {
        rfidInputRef.current.focus();
      }
    }
  };

  // Parse CSV or Excel (.xlsx, .xls)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportFile(file);
    setParseError(null);
    setImportFeedback(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to json array
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rawRows || rawRows.length < 2) {
          throw new Error('The selected file is empty or does not contain data rows.');
        }

        // Detect column indices based on header row
        const headers = rawRows[0].map(h => String(h).trim().toLowerCase());
        
        const cardColIdx = headers.findIndex(h => 
          h.includes('card') || h.includes('rfid') || h.includes('tag') || h.includes('uid') || h.includes('id')
        );
        const nameColIdx = headers.findIndex(h => 
          h.includes('name') || h.includes('employee') || h.includes('worker') || h.includes('staff')
        );
        const dateColIdx = headers.findIndex(h => 
          h.includes('date') || h.includes('day') || h.includes('datum')
        );
        const checkInIdx = headers.findIndex(h => 
          h.includes('in') || h.includes('start') || h.includes('arrival') || h.includes('entry')
        );
        const checkOutIdx = headers.findIndex(h => 
          h.includes('out') || h.includes('end') || h.includes('departure') || h.includes('exit')
        );

        if (cardColIdx === -1 && nameColIdx === -1) {
          throw new Error('Could not identify a "Card / RFID" or "Employee Name" column in header row: ' + headers.join(', '));
        }

        const parsed = [];
        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.every(val => !val)) continue; // skip blank line

          const card = cardColIdx !== -1 ? String(row[cardColIdx] || '').trim() : '';
          const name = nameColIdx !== -1 ? String(row[nameColIdx] || '').trim() : '';
          let dateVal = dateColIdx !== -1 ? row[dateColIdx] : '';
          let inVal = checkInIdx !== -1 ? row[checkInIdx] : '';
          let outVal = checkOutIdx !== -1 ? row[checkOutIdx] : '';

          // Format Date
          let dateStr = selectedDate;
          if (dateVal instanceof Date) {
            dateStr = dateVal.toISOString().slice(0, 10);
          } else if (dateVal) {
            const parsedD = new Date(dateVal);
            if (!isNaN(parsedD.getTime())) {
              dateStr = parsedD.toISOString().slice(0, 10);
            }
          }

          // Format In / Out Time string
          const formatTime = (v, defaultVal = '') => {
            if (!v) return defaultVal;
            if (v instanceof Date) {
              return v.toLocaleTimeString('en-US', { hour12: false });
            }
            const s = String(v).trim();
            if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) return s;
            return s || defaultVal;
          };

          const checkIn = formatTime(inVal, '09:00:00');
          const checkOut = formatTime(outVal, '17:30:00');

          if (!card && !name) continue;

          // Check if matches an existing system employee
          const matchedUser = users.find(u => 
            (card && u.rfid_card && u.rfid_card.toLowerCase() === card.toLowerCase()) ||
            (name && u.full_name && u.full_name.toLowerCase().includes(name.toLowerCase()))
          );

          parsed.push({
            rfid_card: card || (matchedUser?.rfid_card || `RFID-${Math.random().toString().slice(2, 8)}`),
            employee_name: name || matchedUser?.full_name || 'Cardholder ' + card.slice(-4),
            attendance_date: dateStr,
            check_in_time: checkIn,
            check_out_time: checkOut,
            matchedUser: matchedUser || null
          });
        }

        if (parsed.length === 0) {
          throw new Error('No valid attendance rows could be extracted. Please check the column headers.');
        }

        setPreviewRows(parsed);
      } catch (err) {
        console.error('File parse error:', err);
        setParseError(err.message || 'Failed to read file format.');
        setPreviewRows([]);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Submit batch import to backend
  const handleConfirmImport = async () => {
    if (!previewRows || previewRows.length === 0) return;

    try {
      setImporting(true);
      setParseError(null);

      const res = await api.importAttendance({
        records: previewRows,
        source: importFile?.name || 'File Upload',
        actor_name: currentUser?.full_name || 'Admin'
      });

      setImportFeedback({
        success: true,
        message: res.message || `Successfully imported ${res.insertedCount} attendance records.`
      });

      setTimeout(() => {
        setShowUploadModal(false);
        setImportFile(null);
        setPreviewRows([]);
        setImportFeedback(null);
        loadAttendanceData();
      }, 1500);
    } catch (err) {
      setParseError(err.message || 'Import failed on server.');
    } finally {
      setImporting(false);
    }
  };

  // Download Sample Template CSV / Excel
  const handleDownloadTemplate = () => {
    const templateData = [
      { 'RFID Card': 'E4A981C2', 'Employee Name': 'Alex Morgan', 'Date': selectedDate, 'Check In': '08:55', 'Check Out': '17:35' },
      { 'RFID Card': '71B04523', 'Employee Name': 'Marcus Vance', 'Date': selectedDate, 'Check In': '09:02', 'Check Out': '17:30' },
      { 'RFID Card': '9C28D5F1', 'Employee Name': 'Sara Lindqvist', 'Date': selectedDate, 'Check In': '09:42', 'Check Out': '18:15' },
      { 'RFID Card': '438FA902', 'Employee Name': 'Elena Rostova', 'Date': selectedDate, 'Check In': '08:48', 'Check Out': '17:00' }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'RFID_Attendance_Template');
    XLSX.writeFile(wb, 'RFID_Reader_Attendance_Sample.xlsx');
  };

  // Link card to an employee
  const handleOpenLinkModal = (log) => {
    setTargetLog(log);
    setSelectedUserId(log.user_id || '');
    setShowLinkModal(true);
  };

  const handleSaveCardLink = async () => {
    if (!targetLog || !selectedUserId) return;
    try {
      setLinking(true);
      await api.linkUserRfid(
        selectedUserId, 
        targetLog.rfid_card, 
        currentUser?.full_name || 'Admin'
      );
      setShowLinkModal(false);
      setTargetLog(null);
      loadAttendanceData();
    } catch (err) {
      alert('Failed to assign card: ' + err.message);
    } finally {
      setLinking(false);
    }
  };

  // Delete Log
  const handleDeleteLog = async (id) => {
    if (!window.confirm('Are you sure you want to remove this attendance scan log?')) return;
    try {
      await api.deleteAttendance(id);
      loadAttendanceData();
    } catch (err) {
      alert('Failed to delete log: ' + err.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 border border-slate-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold tracking-wide uppercase border border-emerald-500/30">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              Hardware RFID Card Reader Bridge
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              RFID Attendance System
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Import logs directly from physical RFID card readers via <strong>CSV</strong> or <strong>Excel</strong> spreadsheets, or connect live USB contactless card scanners for instant tap-in tap-out.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-md shadow-emerald-700/30 cursor-pointer active:scale-95"
            >
              <Upload className="w-4 h-4" />
              Import CSV / Excel
            </button>
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-600/60 font-medium text-xs transition-all cursor-pointer"
              title="Download sample template for RFID card reader logs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Sample Template
            </button>
          </div>
        </div>

        {/* Live Card Tap Quick-Bar */}
        <div className="mt-6 pt-6 border-t border-slate-700/60">
          <form onSubmit={handleRfidScanSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <CreditCard className="w-5 h-5 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={rfidInputRef}
                type="text"
                value={rfidInput}
                onChange={(e) => setRfidInput(e.target.value)}
                placeholder="Scan / Tap RFID Card Number (or type tag ID and press Enter)..."
                className="w-full bg-slate-800/90 text-white placeholder-slate-400 text-sm pl-11 pr-4 py-2.5 rounded-xl border border-slate-600/80 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 font-mono transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isScanning || !rfidInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-sm"
            >
              {isScanning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Radio className="w-4 h-4" />
              )}
              Register Tap
            </button>
          </form>

          {/* Scan result toast */}
          {lastScanResult && (
            <div className={`mt-3 p-3 rounded-xl text-xs flex items-center justify-between border ${
              lastScanResult.success 
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' 
                : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
            }`}>
              <div className="flex items-center gap-2.5">
                {lastScanResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{lastScanResult.message}</span>
              </div>
              <button 
                onClick={() => setLastScanResult(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Active Employees */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Staff</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800 font-mono">
              {summary?.total_employees || users.length || 0}
            </span>
            <span className="text-[11px] text-slate-400">members</span>
          </div>
        </div>

        {/* Scanned Today */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Scanned</span>
            <CreditCard className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 font-mono">
              {summary?.scanned_today || attendanceLogs.length}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">punches</span>
          </div>
        </div>

        {/* Present on Time */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Present</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {summary?.present_count || attendanceLogs.filter(l => l.status === 'Present').length}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">On-Time</span>
          </div>
        </div>

        {/* Late Arrival */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Late</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 font-mono">
              {summary?.late_count || attendanceLogs.filter(l => l.status === 'Late').length}
            </span>
            <span className="text-[11px] text-amber-600">&gt; 09:30</span>
          </div>
        </div>

        {/* Total Hours Logged */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Hours Worked</span>
            <TrendingUp className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-sky-600 font-mono">
              {summary?.total_hours || attendanceLogs.reduce((acc, curr) => acc + (parseFloat(curr.total_hours) || 0), 0).toFixed(1)}
            </span>
            <span className="text-[11px] text-slate-400">hrs</span>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Turnout</span>
            <Flame className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700 font-mono">
              {summary?.attendance_rate || 0}%
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">rate</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadAttendanceData()}
              placeholder="Filter by employee name, card #, terminal..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-lg text-xs">
            {['ALL', 'Present', 'Late', 'Half Day'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer ${
                  statusFilter === st 
                    ? 'bg-white text-emerald-700 shadow-xs font-semibold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Refresh & Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadAttendanceData}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Attendance Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-sm">Attendance Punch Records</h3>
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium">
              {attendanceLogs.length} entries
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">Date: {selectedDate}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
              <tr>
                <th className="py-3 px-4">Employee / Cardholder</th>
                <th className="py-3 px-4">RFID Card UID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Check In</th>
                <th className="py-3 px-4">Check Out</th>
                <th className="py-3 px-4">Total Hours</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Source / Terminal</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && attendanceLogs.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    Loading RFID logs...
                  </td>
                </tr>
              ) : attendanceLogs.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12">
                    <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700">No attendance scans recorded for {selectedDate}</p>
                    <p className="text-xs text-slate-400 mt-1">Import a CSV/Excel file from your card reader or tap a card above.</p>
                  </td>
                </tr>
              ) : (
                attendanceLogs.map((log) => {
                  const isLinked = Boolean(log.user_id);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name / User */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {log.avatar_url ? (
                            <img 
                              src={log.avatar_url} 
                              alt="" 
                              className="w-8 h-8 rounded-full object-cover border border-slate-200" 
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs uppercase">
                              {(log.employee_name || log.full_name || 'U').charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <span>{log.full_name || log.employee_name || 'Unassigned Card'}</span>
                              {isLinked ? (
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-medium">
                                  Matched
                                </span>
                              ) : (
                                <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                                  Unlinked
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {log.designation || log.department || 'Hardware Scan'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* RFID Card UID */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-xs">
                          <CreditCard className="w-3 h-3 text-slate-400" />
                          <span>{log.rfid_card}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 font-medium text-slate-600">
                        {log.attendance_date}
                      </td>

                      {/* Check In */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1 text-emerald-700 font-mono font-semibold">
                          <Clock className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{log.check_in_time || '--:--'}</span>
                        </div>
                      </td>

                      {/* Check Out */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1 text-slate-700 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.check_out_time || '--:--'}</span>
                        </div>
                      </td>

                      {/* Total Hours */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {log.total_hours ? `${log.total_hours} hrs` : '--'}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                          log.status === 'Present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.status === 'Late'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {log.status || 'Present'}
                        </span>
                      </td>

                      {/* Terminal / Source */}
                      <td className="py-3 px-4 text-[11px] text-slate-500">
                        <span className="truncate max-w-[130px] block" title={log.terminal_id || log.raw_source}>
                          {log.terminal_id || log.raw_source || 'RFID Reader'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!isLinked && (
                            <button
                              onClick={() => handleOpenLinkModal(log)}
                              className="px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-300 transition-colors cursor-pointer flex items-center gap-1"
                              title="Assign this card UID to a company employee"
                            >
                              <UserPlus className="w-3 h-3" />
                              Link
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Delete log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSV / Excel Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Import RFID Reader Data</h3>
                  <p className="text-xs text-slate-500">Supports .CSV, .XLSX, and .XLS from physical card scanner logs</p>
                </div>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dropzone */}
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 text-center transition-all bg-slate-50/50">
                <input
                  type="file"
                  id="rfid-file-input"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="rfid-file-input" className="cursor-pointer flex flex-col items-center">
                  <Upload className="w-8 h-8 text-emerald-600 mb-2" />
                  <span className="text-sm font-semibold text-slate-800">
                    {importFile ? importFile.name : 'Choose RFID CSV or Excel File'}
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    Drag & drop or click to browse. Max size 10MB.
                  </span>
                </label>
              </div>

              {/* Error box */}
              {parseError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Parsing Error:</span> {parseError}
                  </div>
                </div>
              )}

              {/* Success feedback */}
              {importFeedback && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{importFeedback.message}</span>
                </div>
              )}

              {/* Preview Table */}
              {previewRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Preview: {previewRows.length} Rows Detected</span>
                    <span className="text-emerald-700 font-medium">
                      {previewRows.filter(r => r.matchedUser).length} employees matched
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-[11px] text-slate-600">
                      <thead className="bg-slate-100 font-semibold text-slate-600 sticky top-0">
                        <tr>
                          <th className="p-2">Card UID</th>
                          <th className="p-2">Employee</th>
                          <th className="p-2">Date</th>
                          <th className="p-2">Check In</th>
                          <th className="p-2">Check Out</th>
                          <th className="p-2">Match Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {previewRows.slice(0, 10).map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 font-mono text-slate-800">{r.rfid_card}</td>
                            <td className="p-2 font-medium text-slate-800">{r.employee_name}</td>
                            <td className="p-2">{r.attendance_date}</td>
                            <td className="p-2 font-mono text-emerald-700">{r.check_in_time}</td>
                            <td className="p-2 font-mono">{r.check_out_time}</td>
                            <td className="p-2">
                              {r.matchedUser ? (
                                <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">
                                  ✓ {r.matchedUser.full_name}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">Unmatched</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {previewRows.length > 10 && (
                    <p className="text-[11px] text-slate-400 text-center italic">
                      + {previewRows.length - 10} more rows will be imported
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-xs text-emerald-700 hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download Sample Format
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={importing || previewRows.length === 0}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-emerald-700/20 cursor-pointer flex items-center gap-1.5"
                >
                  {importing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Confirm & Import ({previewRows.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Card Modal */}
      {showLinkModal && targetLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <span>Link RFID Card to Employee</span>
              </div>
              <button 
                onClick={() => setShowLinkModal(false)} 
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500">RFID Card UID:</span>
                <div className="mt-1 font-mono font-bold text-slate-800 bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                  {targetLog.rfid_card}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Select Team Member to Assign:
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choose Employee --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.designation || u.role}) {u.rfid_card ? `[Current: ${u.rfid_card}]` : '[No Card]'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCardLink}
                disabled={linking || !selectedUserId}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                {linking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save Card Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
