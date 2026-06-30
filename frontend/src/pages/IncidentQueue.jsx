import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/ToastProvider';
import { 
  getIncidentQueue, 
  bulkAssignDepartment, 
  bulkAssignOfficer, 
  bulkChangeStatus, 
  bulkCloseIncidents, 
  bulkMergeDuplicates, 
  bulkMarkVerified 
} from '../services/adminService';
import { getAllOfficers } from '../services/officerService';
import { 
  Search, ShieldAlert, ArrowUpDown, ChevronLeft, ChevronRight, 
  Loader2, CheckCircle2, UserCheck, Eye, Trash2, Shield, Calendar, MapPin
} from 'lucide-react';

export default function IncidentQueue() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // API states
  const [incidents, setIncidents] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Pagination states
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(25);
  const [sort, setSort] = useState('createdAt');
  const [direction, setDirection] = useState('desc');

  // Search & Filter states
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [city, setCity] = useState('');
  const [resolved, setResolved] = useState(false);
  const [unassigned, setUnassigned] = useState(searchParams.get('unassigned') === 'true');
  const [highRisk, setHighRisk] = useState(searchParams.get('highRisk') === 'true');
  const [requiresReview, setRequiresReview] = useState(searchParams.get('requiresReview') === 'true');
  const [duplicate, setDuplicate] = useState(false);

  // Bulk operation states
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkTargetOfficer, setBulkTargetOfficer] = useState('');
  const [bulkTargetDept, setBulkTargetDept] = useState('');
  const [bulkTargetStatus, setBulkTargetStatus] = useState('');
  const [submittingBulk, setSubmittingBulk] = useState(false);

  // Accessibility keyboard navigation states
  const [focusedRowIndex, setFocusedRowIndex] = useState(-1);
  const tableRef = useRef(null);

  // Fetch Officers list for dropdown
  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        const res = await getAllOfficers();
        if (res.success) {
          setOfficers(res.data || []);
        }
      } catch (err) {
        console.warn("Failed to load officer list", err);
      }
    };
    fetchOfficers();
  }, []);

  // Fetch paginated incidents queue
  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await getIncidentQueue({
        page,
        size,
        sort,
        direction,
        status,
        priority,
        department,
        category,
        city,
        search,
        resolved,
        unassigned,
        duplicate,
        requiresReview,
        highRisk
      });

      if (res.success && res.data) {
        setIncidents(res.data.content || []);
        setTotalElements(res.data.totalElements || 0);
        setTotalPages(res.data.totalPages || 0);
        setSelectedIds([]); // Reset selection on page changes
        setFocusedRowIndex(-1); // Reset key focus
      }
    } catch (err) {
      console.error(err);
      toast('Failed to load incident management queue.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [
    page, size, sort, direction, status, priority, 
    department, category, city, resolved, unassigned, 
    duplicate, requiresReview, highRisk
  ]);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      fetchQueue();
    }, 450);
    return () => clearTimeout(timer);
  }, [search]);

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(incidents.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id, e) => {
    e.stopPropagation();
    if (selectedIds.contains(id)) {
      setSelectedIds(prev => prev.filter(x => x !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  // Keyboard navigation hotkeys
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        return;
      }

      // Ctrl + A: select page
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        setSelectedIds(incidents.map(i => i.id));
        toast("Selected all items on the page.", "info");
      }

      // Down Arrow
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedRowIndex(prev => Math.min(incidents.length - 1, prev + 1));
      }

      // Up Arrow
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedRowIndex(prev => Math.max(0, prev - 1));
      }

      // Enter key opens incident
      if (e.key === 'Enter' && focusedRowIndex >= 0) {
        e.preventDefault();
        const target = incidents[focusedRowIndex];
        if (target) {
          navigate(`/incidents/${target.id}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [incidents, focusedRowIndex]);

  // Bulk Operations Submit
  const handleExecuteBulk = async () => {
    if (selectedIds.length === 0) return;
    setSubmittingBulk(true);

    try {
      let res;
      if (bulkAction === 'assign_department') {
        if (!bulkTargetDept) return toast("Select a department", "error");
        res = await bulkAssignDepartment(selectedIds, bulkTargetDept);
      } else if (bulkAction === 'assign_officer') {
        if (!bulkTargetOfficer) return toast("Select an officer", "error");
        res = await bulkAssignOfficer(selectedIds, bulkTargetOfficer);
      } else if (bulkAction === 'change_status') {
        if (!bulkTargetStatus) return toast("Select a status", "error");
        res = await bulkChangeStatus(selectedIds, bulkTargetStatus);
      } else if (bulkAction === 'close') {
        res = await bulkCloseIncidents(selectedIds);
      } else if (bulkAction === 'merge') {
        res = await bulkMergeDuplicates(selectedIds);
      } else if (bulkAction === 'verify') {
        res = await bulkMarkVerified(selectedIds);
      }

      if (res && res.success) {
        toast(`Bulk operation '${bulkAction.replace('_', ' ')}' executed successfully.`, 'success');
        setBulkAction('');
        setSelectedIds([]);
        fetchQueue();
      }
    } catch (err) {
      console.error(err);
      toast('Bulk operation dispatch failed.', 'error');
    } finally {
      setSubmittingBulk(false);
    }
  };

  // Mock Export function
  const handleExport = () => {
    if (selectedIds.length === 0) return toast("Select records to export.", "error");
    const selectedData = incidents.filter(i => selectedIds.contains(i.id));
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(selectedData, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `incident_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast("Exported selected records to JSON format.", "success");
  };

  const getPriorityBadge = (prio) => {
    switch (prio?.toUpperCase()) {
      case 'CRITICAL':
      case 'P1': return 'bg-rose-500/10 text-rose-550 border-rose-500/20';
      case 'HIGH':
      case 'P2': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'MEDIUM':
      case 'P3': return 'bg-yellow-500/10 text-yellow-405 border-yellow-500/20';
      case 'LOW':
      case 'P4':
      default: return 'bg-blue-505/10 text-blue-400 border-blue-500/20';
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'RESOLVED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'IN_PROGRESS': return 'bg-blue-500/10 text-blue-450 border-blue-505/20';
      case 'INVESTIGATING': return 'bg-purple-500/10 text-purple-400 border-purple-505/20';
      case 'ASSIGNED': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'REPORTED':
      default: return 'bg-slate-500/10 text-slate-400 border-slate-800';
    }
  };

  const handleSortChange = (field) => {
    if (sort === field) {
      setDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(field);
      setDirection('desc');
    }
    setPage(0);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4 animate-fade-in text-slate-200">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Incident Queue</h2>
        <p className="text-xs text-slate-450 mt-1 font-medium">
          Production dispatch control board. Manage, analyze, filter, and dispatch civic incident reports at scale.
        </p>
      </div>

      {/* Grid Split: Filter sidebar + Queue list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Quick Filter Sidebar */}
        <Card className="lg:col-span-3 p-5 bg-slate-900/30 border-slate-850 space-y-5 shadow-md">
          <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
            <span className="text-[10px] text-slate-450 uppercase font-black tracking-wider block">Operational Filters</span>
            <Button
              variant="ghost"
              onClick={() => {
                setStatus(''); setPriority(''); setCategory(''); setDepartment(''); setCity('');
                setResolved(false); setUnassigned(false); setHighRisk(false); setRequiresReview(false);
                setDuplicate(false); setSearch('');
              }}
              className="text-[9px] font-bold text-emerald-400 hover:bg-slate-850 p-1.5 h-6 rounded-lg"
            >
              Clear All
            </Button>
          </div>

          <div className="space-y-4">
            {/* Status Filter */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Status</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-950/40 border border-slate-850 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500/50 text-slate-350 font-bold"
              >
                <option value="">All Statuses</option>
                <option value="REPORTED">Reported</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="INVESTIGATING">Investigating</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Priority</label>
              <select 
                value={priority} 
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-950/40 border border-slate-850 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500/50 text-slate-350 font-bold"
              >
                <option value="">All Priorities</option>
                <option value="P1">P1 - Critical</option>
                <option value="P2">P2 - High</option>
                <option value="P3">P3 - Medium</option>
                <option value="P4">P4 - Low</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Category</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950/40 border border-slate-850 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500/50 text-slate-350 font-bold"
              >
                <option value="">All Categories</option>
                <option value="ROADS">Roads / Potholes</option>
                <option value="SANITATION">Sanitation / Waste</option>
                <option value="WATER">Water Leaks</option>
                <option value="ELECTRICAL">Grid Power</option>
                <option value="PARKS">Parks & Rec</option>
                <option value="TRAFFIC">Traffic Control</option>
                <option value="HOUSING">Communal Housing</option>
                <option value="ENVIRONMENT">Eco / Smell</option>
              </select>
            </div>

            {/* Department Filter */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Assigned Department</label>
              <select 
                value={department} 
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-950/40 border border-slate-850 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500/50 text-slate-350 font-bold"
              >
                <option value="">All Departments</option>
                <option value="Public Works">Public Works</option>
                <option value="Sanitation">Sanitation</option>
                <option value="Water Division">Water Division</option>
                <option value="Electrical Grid">Electrical Grid</option>
                <option value="Parks & Recreation">Parks & Recreation</option>
                <option value="Traffic Control">Traffic Control</option>
                <option value="Housing Authority">Housing Authority</option>
                <option value="Environmental Health">Environmental Health</option>
              </select>
            </div>

            {/* City Filter */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">City Sector</label>
              <input
                type="text"
                placeholder="Filter by city..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-950/40 border border-slate-850 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500/50 text-slate-350"
              />
            </div>

            {/* Quick Flag Checkboxes */}
            <div className="space-y-3 pt-2.5 border-t border-slate-850">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Filters & Alerts</label>
              
              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-400 font-semibold select-none">
                <input 
                  type="checkbox" 
                  checked={highRisk} 
                  onChange={(e) => setHighRisk(e.target.checked)}
                  className="rounded border-slate-850 bg-slate-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                />
                <span>High Risk (Risk &ge; 70)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-400 font-semibold select-none">
                <input 
                  type="checkbox" 
                  checked={unassigned} 
                  onChange={(e) => setUnassigned(e.target.checked)}
                  className="rounded border-slate-850 bg-slate-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                />
                <span>Unassigned Reports</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-400 font-semibold select-none">
                <input 
                  type="checkbox" 
                  checked={requiresReview} 
                  onChange={(e) => setRequiresReview(e.target.checked)}
                  className="rounded border-slate-850 bg-slate-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                />
                <span>Requires AI Review</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-400 font-semibold select-none">
                <input 
                  type="checkbox" 
                  checked={duplicate} 
                  onChange={(e) => setDuplicate(e.target.checked)}
                  className="rounded border-slate-850 bg-slate-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                />
                <span>Duplicate Submissions</span>
              </label>
            </div>
          </div>
        </Card>

        {/* Right Column: Queue Listing Workspace */}
        <div className="lg:col-span-9 space-y-4">
          
          {/* Action Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/10 border border-slate-850 p-4 rounded-2xl w-full">
            {/* Search Input */}
            <div className="relative w-full md:w-80 shrink-0">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Search by ID, title, citizen, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950/40 border border-slate-850 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:border-emerald-500/50 focus:outline-none placeholder-slate-500 text-slate-200"
              />
            </div>

            {/* Pagination Size & Sorting selection */}
            <div className="flex flex-wrap gap-2.5 items-center w-full justify-end">
              <select
                value={size}
                onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
                className="bg-slate-950/50 border border-slate-850 text-[10px] font-black rounded-xl px-3 py-2 focus:outline-none text-slate-350"
              >
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
                <option value={250}>250 per page</option>
              </select>
            </div>
          </div>

          {/* Bulk Operations Toolbar */}
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-emerald-500/5 border-2 border-emerald-500/20 rounded-2xl animate-scale-in">
              <div className="flex items-center gap-2 text-xs font-black text-white">
                <Shield size={14} className="text-emerald-500 shrink-0" />
                <span>{selectedIds.length} incidents selected</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-[10px] font-black rounded-xl px-2.5 py-1.5 focus:outline-none text-slate-300"
                >
                  <option value="">Choose Bulk Action...</option>
                  <option value="assign_department">Bulk Assign Department</option>
                  <option value="assign_officer">Bulk Dispatch to Officer</option>
                  <option value="change_status">Bulk Change Status</option>
                  <option value="close">Bulk Close Tickets</option>
                  <option value="verify">Bulk Verify Resolutions</option>
                  <option value="merge">Merge Duplicate Reports</option>
                </select>

                {/* Sub Options depending on selection */}
                {bulkAction === 'assign_department' && (
                  <select
                    value={bulkTargetDept}
                    onChange={(e) => setBulkTargetDept(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-[10px] font-black rounded-xl px-2.5 py-1.5 focus:outline-none text-slate-300"
                  >
                    <option value="">Select Department...</option>
                    <option value="Public Works">Public Works</option>
                    <option value="Sanitation">Sanitation</option>
                    <option value="Water Division">Water Division</option>
                    <option value="Electrical Grid">Electrical Grid</option>
                    <option value="Parks & Recreation">Parks & Recreation</option>
                    <option value="Traffic Control">Traffic Control</option>
                    <option value="Housing Authority">Housing Authority</option>
                    <option value="Environmental Health">Environmental Health</option>
                  </select>
                )}

                {bulkAction === 'assign_officer' && (
                  <select
                    value={bulkTargetOfficer}
                    onChange={(e) => setBulkTargetOfficer(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-[10px] font-black rounded-xl px-2.5 py-1.5 focus:outline-none text-slate-300"
                  >
                    <option value="">Select Officer...</option>
                    {officers.map(o => (
                      <option key={o.id} value={o.id}>{o.name} ({o.department})</option>
                    ))}
                  </select>
                )}

                {bulkAction === 'change_status' && (
                  <select
                    value={bulkTargetStatus}
                    onChange={(e) => setBulkTargetStatus(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-[10px] font-black rounded-xl px-2.5 py-1.5 focus:outline-none text-slate-300"
                  >
                    <option value="">Select Status...</option>
                    <option value="REPORTED">Reported</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="INVESTIGATING">Investigating</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                )}

                {bulkAction && (
                  <Button
                    onClick={handleExecuteBulk}
                    isLoading={submittingBulk}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-bold px-3 py-1.5 rounded-xl shadow shrink-0"
                  >
                    Apply Actions
                  </Button>
                )}

                <Button
                  onClick={handleExport}
                  className="bg-slate-900 hover:bg-slate-850 text-white border border-slate-800 text-[10px] font-bold px-3 py-1.5 rounded-xl shrink-0"
                >
                  Export Records
                </Button>
              </div>
            </div>
          )}

          {/* Heavy Tabular Queue log */}
          <div className="overflow-x-auto border border-slate-850 rounded-2xl bg-slate-950/10" ref={tableRef}>
            <table className="w-full text-left border-collapse text-xs select-none">
              <thead>
                <tr className="border-b border-slate-850 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900/10">
                  <th className="py-3.5 px-3 w-8 text-center">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll} 
                      checked={incidents.length > 0 && selectedIds.length === incidents.length}
                      className="rounded border-slate-850 bg-slate-950 text-emerald-500"
                    />
                  </th>
                  <th className="py-3.5 px-3 cursor-pointer hover:text-slate-300 transition-colors" onClick={() => handleSortChange('priority')}>
                    <div className="flex items-center gap-1">Priority <ArrowUpDown size={10} /></div>
                  </th>
                  <th className="py-3.5 px-3 cursor-pointer hover:text-slate-300 transition-colors" onClick={() => handleSortChange('status')}>
                    <div className="flex items-center gap-1">Status <ArrowUpDown size={10} /></div>
                  </th>
                  <th className="py-3.5 px-3">ID</th>
                  <th className="py-3.5 px-3 max-w-[200px] truncate">Incident Summary</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3">Location</th>
                  <th className="py-3.5 px-3">Assignee Crew</th>
                  <th className="py-3.5 px-3 cursor-pointer hover:text-slate-300" onClick={() => handleSortChange('risk')}>
                    <div className="flex items-center gap-1">Risk <ArrowUpDown size={10} /></div>
                  </th>
                  <th className="py-3.5 px-3 cursor-pointer hover:text-slate-300" onClick={() => handleSortChange('createdAt')}>
                    <div className="flex items-center gap-1">Reported <ArrowUpDown size={10} /></div>
                  </th>
                  <th className="py-3.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="11" className="py-12 text-center">
                      <Loader2 size={24} className="animate-spin text-emerald-500 mx-auto" />
                      <span className="text-[10px] text-slate-500 mt-2 block">Loading dispatch queue logs...</span>
                    </td>
                  </tr>
                ) : incidents.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="py-12 text-center font-bold text-slate-550">
                      No active tickets match query configurations.
                    </td>
                  </tr>
                ) : (
                  incidents.map((item, idx) => {
                    const isSelected = selectedIds.contains(item.id);
                    const isKeyboardFocused = idx === focusedRowIndex;

                    return (
                      <tr 
                        key={item.id}
                        onClick={() => navigate(`/incidents/${item.id}`)}
                        className={`border-b border-slate-850/60 hover:bg-slate-900/40 cursor-pointer transition-colors group ${
                          isSelected ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : ''
                        } ${isKeyboardFocused ? 'ring-2 ring-emerald-500 bg-slate-900/30' : ''}`}
                      >
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={(e) => handleSelectRow(item.id, e)}
                            className="rounded border-slate-850 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="py-3 px-3 font-mono font-bold">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase tracking-wider ${getPriorityBadge(item.priority)}`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase tracking-wider ${getStatusBadge(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-black text-slate-400">
                          {item.id.slice(0, 8)}
                        </td>
                        <td className="py-3 px-3 max-w-[200px] truncate font-bold text-white group-hover:underline">
                          {item.title}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-400 uppercase tracking-wider text-[9px]">
                          {item.category?.replace(/_/g, ' ')}
                        </td>
                        <td className="py-3 px-3 truncate max-w-[120px] text-slate-400 flex items-center gap-0.5">
                          <MapPin size={10} className="shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-350">
                          <div className="font-semibold">{item.assignedOfficer}</div>
                          <div className="text-[9px] text-slate-500">{item.assignedDepartment}</div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`font-mono font-black text-xs ${
                            item.riskScore >= 70 ? 'text-rose-500' : item.riskScore >= 40 ? 'text-amber-500' : 'text-emerald-500'
                          }`}>
                            {item.riskScore}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-mono text-[9px]">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            onClick={() => navigate(`/incidents/${item.id}`)}
                            className="p-1 h-7 border border-slate-800 rounded-lg hover:bg-slate-850 hover:text-white text-slate-400 flex items-center gap-1 font-bold text-[9px] shrink-0"
                          >
                            <Eye size={10} />
                            Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {!loading && totalPages > 1 && (
            <div className="flex justify-between items-center bg-slate-900/10 p-4 border border-slate-850 rounded-2xl">
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider">
                Page {page + 1} of {totalPages} ({totalElements} total records)
              </span>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => setPage(prev => Math.max(0, prev - 1))}
                  className="p-2 border-slate-800 text-slate-400 hover:bg-slate-850 rounded-xl"
                >
                  <ChevronLeft size={14} />
                </Button>
                <Button
                  variant="outline"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                  className="p-2 border-slate-800 text-slate-400 hover:bg-slate-850 rounded-xl"
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}

          {/* Shortcut instructions */}
          <div className="text-[9px] font-bold text-slate-500 bg-slate-950/20 p-3 rounded-xl border border-slate-850 flex items-center justify-between">
            <span>💡 Accessibility Shortcuts: Use <kbd className="px-1.5 py-0.5 rounded bg-slate-850 border border-slate-750 text-white font-mono">ArrowUp</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-850 border border-slate-750 text-white font-mono">ArrowDown</kbd> to focus rows, <kbd className="px-1.5 py-0.5 rounded bg-slate-850 border border-slate-750 text-white font-mono">Enter</kbd> to view details.</span>
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-850 border border-slate-750 text-white font-mono">Ctrl + A</kbd> to select all.</span>
          </div>

        </div>

      </div>

    </div>
  );
}
