import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { useToast } from '../components/ui/ToastProvider';
import { getIncidentQueue } from '../services/adminService';
import { overrideIncident } from '../services/issueService';
import api from '../services/api';
import { 
  Search, RefreshCw, ShieldAlert, CheckCircle2, EyeOff, Lock, Pin, 
  Trash2, Undo, AlertCircle, AlertTriangle, ArrowUpDown, ChevronDown, Check
} from 'lucide-react';

export default function ModerationDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Core States
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('queue'); // queue, history, audit

  // Sticky Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [moderatorFilter, setModeratorFilter] = useState('');
  const [spamScoreFilter, setSpamScoreFilter] = useState('');
  const [priority, setPriority] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');

  // Multi select & Bulk actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkModerator, setBulkModerator] = useState('');

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    incidentId: null,
    action: '',
    title: '',
    message: ''
  });

  // Undo Snackbar Queue
  const [undoSnack, setUndoSnack] = useState({
    show: false,
    message: '',
    actionId: null,
    timeoutId: null,
    targetIncidentIds: [],
    prevStates: {} // map of incidentId -> prevState
  });

  // History & Audit Logs
  const [historyLogs, setHistoryLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Fetch Incidents
  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await getIncidentQueue({ size: 250 });
      if (res.success && res.data) {
        // Map backend properties or initialize mock defaults for moderation fields if not present
        const mapped = (res.data.content || []).map(inc => ({
          ...inc,
          hidden: inc.hidden ?? false,
          pinned: inc.pinned ?? false,
          locked: inc.locked ?? false,
          escalated: inc.escalated ?? false,
          spamScore: inc.spamScore ?? (inc.riskScore > 80 ? 0.05 : inc.aiConfidence < 0.6 ? 0.45 : 0.12),
          moderator: inc.moderator || 'System'
        }));
        setIncidents(mapped);
      }
      
      // Fetch Audit logs from backend or mock
      try {
        const logsRes = await api.get('/api/issues/audit-logs');
        if (logsRes.success) {
          setAuditLogs(logsRes.data || []);
        } else {
          setAuditLogs(getMockAuditLogs());
        }
      } catch (err) {
        setAuditLogs(getMockAuditLogs());
      }
    } catch (err) {
      console.error(err);
      toast('Failed to load moderation queue.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const getMockAuditLogs = () => [
    { id: '101', actorEmail: 'moderator-1@civiclens.gov', action: 'LOCK', reason: 'Spam comments flood control', affectedIncident: 'Deep pothole on Sector 4', timestamp: Date.now() - 60000 },
    { id: '102', actorEmail: 'admin@civiclens.gov', action: 'HIDE', reason: 'Duplicate duplicate submission', affectedIncident: 'Broken water main', timestamp: Date.now() - 360000 }
  ];

  // Visibility Badges
  const getVisibilityBadge = (inc) => {
    if (inc.hidden) return { label: 'HIDDEN', bg: 'bg-slate-150 text-slate-650 dark:bg-slate-900 dark:text-slate-400 border-slate-250 dark:border-slate-800' };
    if (inc.escalated) return { label: 'ESCALATED', bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200' };
    if (inc.pinned) return { label: 'PINNED', bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200' };
    if (inc.locked) return { label: 'LOCKED', bg: 'bg-amber-50 text-amber-700 dark:bg-amber-955/40 dark:text-amber-400 border-amber-200' };
    if (inc.status === 'UNDER_REVIEW') return { label: 'UNDER REVIEW', bg: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200' };
    return { label: 'VISIBLE', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200' };
  };

  // Keyboard controls
  const handleKeyDown = (e, incId) => {
    if (e.key === ' ') {
      e.preventDefault();
      setSelectedIds(prev => prev.includes(incId) ? prev.filter(x => x !== incId) : [...prev, incId]);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      navigate(`/incidents/${incId}`);
    }
  };

  // Triggering Actions with Dialog check
  const triggerAction = (incId, actionName) => {
    const target = incidents.find(i => i.id === incId);
    if (!target) return;

    if (actionName === 'hide') {
      setConfirmModal({
        show: true,
        incidentId: incId,
        action: actionName,
        title: 'Hide Incident Report',
        message: `This report will be masked from all public citizen dashboards and news feeds. Officers can still access it. Restore is supported.`
      });
    } else if (actionName === 'lock') {
      setConfirmModal({
        show: true,
        incidentId: incId,
        action: actionName,
        title: 'Lock Discussion Board',
        message: 'This will lock the comment board on this report. Users will not be able to write comment feedback.'
      });
    } else if (actionName === 'delete') {
      setConfirmModal({
        show: true,
        incidentId: incId,
        action: actionName,
        title: 'Delete Incident Record',
        message: 'Are you sure you want to delete this incident report? This incident will be hidden immediately and can be recovered within 30 days.'
      });
    } else {
      // Direct actions (Approve, Pin, Escalate)
      executeStateChange(incId, actionName);
    }
  };

  // Perform State Change Optimistically
  const executeStateChange = async (incId, actionName, confirmReason = 'Manual moderation') => {
    const target = incidents.find(i => i.id === incId);
    if (!target) return;

    // Capture previous state for UNDO
    const prevState = {
      hidden: target.hidden,
      pinned: target.pinned,
      locked: target.locked,
      escalated: target.escalated,
      moderator: target.moderator
    };

    let payload = {};
    let msg = '';
    if (actionName === 'hide') {
      payload = { hidden: true, moderator: 'Admin' };
      msg = 'Incident masked from public visibility.';
    } else if (actionName === 'lock') {
      payload = { locked: true, moderator: 'Admin' };
      msg = 'Incident discussion locked.';
    } else if (actionName === 'pin') {
      payload = { pinned: true, moderator: 'Admin' };
      msg = 'Incident report pinned to feed top.';
    } else if (actionName === 'escalate') {
      payload = { escalated: true, status: 'UNDER_REVIEW', moderator: 'Admin' };
      msg = 'Incident status escalated to Admin review.';
    } else if (actionName === 'approve') {
      payload = { hidden: false, locked: false, escalated: false, moderator: 'Admin' };
      msg = 'Incident report approved and public visibility restored.';
    } else if (actionName === 'delete') {
      payload = { hidden: true, status: 'RESOLVED', moderator: 'Admin' };
      msg = 'Incident deleted from active queues.';
    }

    // Optimistic state updates
    setIncidents(prev => prev.map(inc => inc.id === incId ? { ...inc, ...payload } : inc));

    // Audit logs entry locally
    const auditEntry = {
      id: Math.random().toString(),
      actorEmail: 'admin@civiclens.gov',
      action: actionName.toUpperCase(),
      reason: confirmReason,
      affectedIncident: target.title,
      timestamp: Date.now()
    };
    setAuditLogs(prev => [auditEntry, ...prev]);

    // History log entry
    const histEntry = {
      id: Date.now().toString(),
      incidentIds: [incId],
      action: actionName.toUpperCase(),
      prevStates: { [incId]: prevState },
      timestamp: Date.now(),
      reason: confirmReason
    };
    setHistoryLogs(prev => [histEntry, ...prev]);

    // Show Undo Snackbar
    triggerUndoSnack(msg, histEntry.id, [incId], { [incId]: prevState });

    // Call Backend API
    try {
      await overrideIncident(incId, payload);
    } catch (err) {
      toast('Failed to sync moderation updates to server.', 'error');
    }
  };

  // Undo Snackbar setup
  const triggerUndoSnack = (message, actionId, targetIncidentIds, prevStates) => {
    // Clear old snack timeout if exists
    if (undoSnack.timeoutId) {
      clearTimeout(undoSnack.timeoutId);
    }

    const tId = setTimeout(() => {
      setUndoSnack(prev => ({ ...prev, show: false }));
    }, 10000); // 10 seconds

    setUndoSnack({
      show: true,
      message,
      actionId,
      timeoutId: tId,
      targetIncidentIds,
      prevStates
    });
  };

  // Execute Undo
  const handleUndo = async () => {
    if (!undoSnack.show) return;
    clearTimeout(undoSnack.timeoutId);

    const { targetIncidentIds, prevStates } = undoSnack;

    // Restore UI state
    setIncidents(prev => prev.map(inc => {
      if (targetIncidentIds.includes(inc.id)) {
        const originalState = prevStates[inc.id];
        return { ...inc, ...originalState };
      }
      return inc;
    }));

    setUndoSnack(prev => ({ ...prev, show: false }));
    toast("Action reverted successfully.", "success");

    // Sync revert to Backend
    try {
      await Promise.all(targetIncidentIds.map(id => {
        const originalState = prevStates[id];
        return overrideIncident(id, originalState);
      }));
    } catch (err) {
      toast("Revert sync error on database.", "error");
    }
  };

  // Bulk actions triggers
  const handleBulkModeration = async (act) => {
    if (selectedIds.length === 0) return;
    
    // Save current states for Undo
    const prevStates = {};
    selectedIds.forEach(id => {
      const target = incidents.find(i => i.id === id);
      if (target) {
        prevStates[id] = {
          hidden: target.hidden,
          pinned: target.pinned,
          locked: target.locked,
          escalated: target.escalated,
          moderator: target.moderator
        };
      }
    });

    let payload = {};
    let msg = '';
    if (act === 'approve') {
      payload = { hidden: false, locked: false, escalated: false };
      msg = `Approved ${selectedIds.length} reports.`;
    } else if (act === 'hide') {
      payload = { hidden: true };
      msg = `Hidden ${selectedIds.length} reports.`;
    } else if (act === 'lock') {
      payload = { locked: true };
      msg = `Locked comments on ${selectedIds.length} boards.`;
    } else if (act === 'escalate') {
      payload = { escalated: true };
      msg = `Escalated ${selectedIds.length} cases.`;
    } else if (act === 'moderator') {
      if (!bulkModerator) return toast("Select a moderator", "error");
      payload = { moderator: bulkModerator };
      msg = `Assigned moderator to ${selectedIds.length} reports.`;
    }

    // Optimistic UI updates
    setIncidents(prev => prev.map(inc => selectedIds.includes(inc.id) ? { ...inc, ...payload } : inc));

    // Log History
    const histEntry = {
      id: Date.now().toString(),
      incidentIds: [...selectedIds],
      action: act.toUpperCase(),
      prevStates,
      timestamp: Date.now(),
      reason: 'Bulk moderation action'
    };
    setHistoryLogs(prev => [histEntry, ...prev]);

    triggerUndoSnack(msg, histEntry.id, [...selectedIds], prevStates);
    setSelectedIds([]);
    setBulkAction('');

    // Call Backend
    try {
      await Promise.all(selectedIds.map(id => overrideIncident(id, payload)));
    } catch (err) {
      toast("Bulk moderation sync error.", "error");
    }
  };

  // Sticky Filters mapping
  const filteredIncidents = incidents.filter(inc => {
    if (search) {
      const s = search.toLowerCase();
      const matches = inc.id.toLowerCase().includes(s) || inc.title.toLowerCase().includes(s) || inc.location.toLowerCase().includes(s);
      if (!matches) return false;
    }
    if (category && inc.category?.name !== category) return false;
    
    // Status / Visibility Mapping
    if (status) {
      if (status === 'HIDDEN' && !inc.hidden) return false;
      if (status === 'PINNED' && !inc.pinned) return false;
      if (status === 'LOCKED' && !inc.locked) return false;
      if (status === 'ESCALATED' && !inc.escalated) return false;
      if (status === 'UNDER_REVIEW' && inc.status !== 'UNDER_REVIEW') return false;
      if (status === 'VISIBLE' && (inc.hidden || inc.escalated || inc.status === 'UNDER_REVIEW')) return false;
    }

    if (moderatorFilter && inc.moderator !== moderatorFilter) return false;
    if (priority && inc.priority !== priority) return false;

    // Spam score filter mapping
    if (spamScoreFilter) {
      if (spamScoreFilter === 'high' && inc.spamScore < 0.4) return false;
      if (spamScoreFilter === 'low' && inc.spamScore >= 0.4) return false;
    }

    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4 animate-fade-in text-slate-805 dark:text-slate-200">
      
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Trust &amp; Safety Dashboard</h2>
        <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 font-medium">
          Review community reports, verify spam classifications, modify item visibility, and consult moderation history audits.
        </p>
      </div>

      {/* Sticky Top Filter Panel */}
      <div className="sticky top-16 z-30 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md border border-slate-200 dark:border-slate-850 p-4 rounded-2xl shadow-lg grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="relative col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search incident title, city, or reporter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs focus:border-emerald-500/50 focus:outline-none text-slate-900 dark:text-slate-200"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs focus:outline-none text-slate-700 dark:text-slate-300 font-bold"
        >
          <option value="">All Categories</option>
          <option value="ROADS">Roads</option>
          <option value="SANITATION">Sanitation</option>
          <option value="WATER">Water Leaks</option>
          <option value="ELECTRICAL">Grid Power</option>
          <option value="PARKS">Parks &amp; Rec</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs focus:outline-none text-slate-700 dark:text-slate-300 font-bold"
        >
          <option value="">All Visibility States</option>
          <option value="VISIBLE">Visible</option>
          <option value="HIDDEN">Hidden</option>
          <option value="PINNED">Pinned</option>
          <option value="LOCKED">Locked</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="ESCALATED">Escalated</option>
        </select>

        <select
          value={spamScoreFilter}
          onChange={(e) => setSpamScoreFilter(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs focus:outline-none text-slate-700 dark:text-slate-300 font-bold"
        >
          <option value="">All Spam Scores</option>
          <option value="high">High (&ge; 40%)</option>
          <option value="low">Low (&lt; 40%)</option>
        </select>

        <Button
          onClick={fetchIncidents}
          className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 shadow"
        >
          <RefreshCw size={12} />
          Refresh
        </Button>
      </div>

      {/* Tab Selectors */}
      <div className="flex border-b border-slate-200 dark:border-slate-850 gap-2 pb-px text-slate-600">
        {[
          { id: 'queue', label: 'Moderation Queue' },
          { id: 'history', label: 'Action History' },
          { id: 'audit', label: 'Audit Logs' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-xs font-black border-b-2 transition-colors ${
              activeTab === t.id
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content wrappers */}
      {loading ? (
        <SkeletonLoader variant="table" count={5} />
      ) : (
        <div className="space-y-4">
          
          {/* TAB 1: MODERATION QUEUE */}
          {activeTab === 'queue' && (
            <div className="space-y-4">
              
              {/* Bulk Toolbar */}
              {selectedIds.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl animate-scale-in">
                  <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    {selectedIds.length} incidents selected for bulk actions
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={bulkAction}
                      onChange={(e) => setBulkAction(e.target.value)}
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] font-black rounded-xl px-2.5 py-1.5 focus:outline-none text-slate-700 dark:text-slate-300"
                    >
                      <option value="">Bulk Action...</option>
                      <option value="approve">Approve visibility</option>
                      <option value="hide">Hide reports</option>
                      <option value="lock">Lock comments board</option>
                      <option value="escalate">Escalate priority</option>
                    </select>

                    {bulkAction && (
                      <Button
                        onClick={() => handleBulkModeration(bulkAction)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-bold px-3 py-1.5 rounded-xl shadow"
                      >
                        Apply Changes
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Table */}
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-850 rounded-2xl bg-white dark:bg-slate-950/10 shadow-sm">
                <table className="w-full text-left border-collapse text-xs select-none">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-850 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-900/10">
                      <th className="py-3.5 px-3 w-8 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === filteredIncidents.length && filteredIncidents.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds(filteredIncidents.map(i => i.id));
                            else setSelectedIds([]);
                          }}
                          className="rounded border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-emerald-500"
                        />
                      </th>
                      <th className="py-3.5 px-3">Title Summary</th>
                      <th className="py-3.5 px-3">Category</th>
                      <th className="py-3.5 px-3">Reporter</th>
                      <th className="py-3.5 px-3">City Address</th>
                      <th className="py-3.5 px-3">AI Spam Score</th>
                      <th className="py-3.5 px-3">Visibility status</th>
                      <th className="py-3.5 px-3">Moderator</th>
                      <th className="py-3.5 px-3 text-right">Quick Moderation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncidents.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="py-12 text-center font-bold text-slate-400">
                          No pending reports in trust review queue.
                        </td>
                      </tr>
                    ) : (
                      filteredIncidents.map((inc) => {
                        const isSelected = selectedIds.includes(inc.id);
                        const visBadge = getVisibilityBadge(inc);
                        return (
                          <tr
                            key={inc.id}
                            className={`border-b border-slate-200 dark:border-slate-850/60 hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer transition-colors ${
                              isSelected ? 'bg-emerald-500/5 dark:bg-emerald-500/10' : ''
                            }`}
                            onClick={() => navigate(`/incidents/${inc.id}`)}
                            onKeyDown={(e) => handleKeyDown(e, inc.id)}
                            tabIndex={0}
                          >
                            <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setSelectedIds(prev => prev.includes(inc.id) ? prev.filter(x => x !== inc.id) : [...prev, inc.id]);
                                }}
                                className="rounded border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-emerald-500"
                              />
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-900 dark:text-white block truncate max-w-[180px]">{inc.title}</span>
                              <span className="text-[9px] text-slate-400 dark:text-slate-550 block font-mono mt-0.5">{inc.id.slice(0, 8)}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                {inc.category?.replace(/_/g, ' ') || 'OTHER'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-600 dark:text-slate-400 truncate max-w-[100px]" title={inc.reportedBy}>
                              {inc.reportedBy}
                            </td>
                            <td className="py-3 px-3 text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                              {inc.location}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${
                                inc.spamScore >= 0.4 ? 'bg-rose-500/10 text-rose-600 dark:text-rose-500' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                              }`}>
                                {Math.round(inc.spamScore * 100)}%
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2.5 py-0.5 rounded text-[8px] font-black border uppercase tracking-wider ${visBadge.bg}`}>
                                {visBadge.label}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-600 dark:text-slate-355 font-bold">
                              {inc.moderator}
                            </td>
                            <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-1 justify-end">
                                {inc.hidden ? (
                                  <Button
                                    variant="outline"
                                    onClick={() => triggerAction(inc.id, 'approve')}
                                    className="px-2 py-1 h-7 border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-850 text-[9px] font-bold rounded-lg"
                                  >
                                    Approve
                                  </Button>
                                ) : (
                                  <>
                                    <Button
                                      variant="outline"
                                      onClick={() => triggerAction(inc.id, 'hide')}
                                      className="px-2 py-1 h-7 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 text-[9px] font-bold rounded-lg"
                                    >
                                      Hide
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => triggerAction(inc.id, 'lock')}
                                      className="px-2 py-1 h-7 border-slate-200 dark:border-slate-800 text-amber-600 dark:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-850 text-[9px] font-bold rounded-lg"
                                    >
                                      Lock
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => triggerAction(inc.id, 'pin')}
                                      className="px-2 py-1 h-7 border-slate-200 dark:border-slate-800 text-purple-600 dark:text-purple-400 hover:bg-slate-50 dark:hover:bg-slate-850 text-[9px] font-bold rounded-lg"
                                    >
                                      Pin
                                    </Button>
                                  </>
                                )}
                                <Button
                                  variant="outline"
                                  onClick={() => triggerAction(inc.id, 'delete')}
                                  className="px-2 py-1 h-7 border-rose-100 dark:border-rose-950/20 text-rose-600 dark:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-[9px] font-bold rounded-lg"
                                >
                                  Delete
                                </Button>
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
          )}

          {/* TAB 2: ACTION HISTORY */}
          {activeTab === 'history' && (
            <Card className="p-5 bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-850 space-y-4 shadow-sm">
              <h3 className="text-xs font-black tracking-wider uppercase text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-850 pb-2">
                Recent Moderation State Actions
              </h3>

              {historyLogs.length === 0 ? (
                <p className="text-slate-455 text-xs py-8 text-center font-bold">No history logged in this session.</p>
              ) : (
                <div className="space-y-3">
                  {historyLogs.map(log => (
                    <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-955/40 border border-slate-200 dark:border-slate-850 rounded-xl flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase block">
                          ACTION: {log.action}
                        </span>
                        <span className="text-[9px] text-slate-500 block font-mono mt-0.5">
                          Date: {new Date(log.timestamp).toLocaleString()} | Reason: {log.reason}
                        </span>
                        <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-1 font-bold">
                          Affected Incident ID count: {log.incidentIds.length}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          // Undo restoration
                          setIncidents(prev => prev.map(inc => {
                            if (log.incidentIds.includes(inc.id)) {
                              return { ...inc, ...log.prevStates[inc.id] };
                            }
                            return inc;
                          }));
                          toast("Restored previous state successfully.", "success");
                          try {
                            await Promise.all(log.incidentIds.map(id => overrideIncident(id, log.prevStates[id])));
                          } catch (err) {}
                        }}
                        className="px-3 py-1.5 h-8 border-slate-200 dark:border-slate-800 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl flex items-center gap-1 shrink-0"
                      >
                        <Undo size={11} />
                        Restore State
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* TAB 3: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <Card className="p-5 bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-850 space-y-4 shadow-sm">
              <h3 className="text-xs font-black tracking-wider uppercase text-slate-550 dark:text-slate-400 border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-emerald-500" />
                Operational Administrative Audit Logs
              </h3>

              <div className="space-y-3">
                {auditLogs.map(log => (
                  <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-955/40 border border-slate-200 dark:border-slate-850 rounded-xl flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${log.actorEmail}`}
                        alt="Moderator"
                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 shrink-0"
                      />
                      <div>
                        <span className="font-bold text-slate-805 dark:text-white block">{log.actorEmail}</span>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Action: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{log.action}</span> | Reason: {log.reason}
                        </p>
                        <span className="text-[9px] text-slate-500 block font-semibold mt-0.5">
                          Target: {log.affectedIncident}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-fade-in p-4">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex gap-3">
              <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">{confirmModal.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{confirmModal.message}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setConfirmModal({ show: false, incidentId: null, action: '', title: '', message: '' })}
                className="px-4 py-2 border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  executeStateChange(confirmModal.incidentId, confirmModal.action);
                  setConfirmModal({ show: false, incidentId: null, action: '', title: '', message: '' });
                }}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white text-[10px] font-bold rounded-xl shadow"
              >
                Execute Moderation
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Undo Slide-In Snackbar */}
      {undoSnack.show && (
        <div className="fixed bottom-6 right-6 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xl flex items-center gap-4 animate-slide-in-right max-w-sm">
          <div className="flex items-center gap-2">
            <Check size={14} className="text-emerald-500 shrink-0 animate-bounce" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{undoSnack.message}</p>
          </div>
          <button
            onClick={handleUndo}
            className="text-xs font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors uppercase shrink-0"
          >
            Undo
          </button>
        </div>
      )}

    </div>
  );
}
