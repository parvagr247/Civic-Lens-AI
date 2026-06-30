import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCitizenDashboard } from '../services/dashboardService';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/ToastProvider';
import { 
  Loader2, CheckCircle, FileText, MapPin, Calendar, 
  Eye, Shield, Clock, Zap, AlertCircle, AlertTriangle, 
  ArrowRight, Edit3, Search, User, Bell, Activity
} from 'lucide-react';

/**
 * CitizenDashboard component.
 * Task-oriented workspace serving as a command center for citizen reports.
 */
export default function CitizenDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await getCitizenDashboard();
        if (response.success) {
          setData(response.data);
        }
      } catch (err) {
        console.error('Failed to load citizen dashboard', err);
        toast('Failed to load dashboard metrics.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 size={32} className="animate-spin text-emerald-400" />
        <span className="text-sm text-slate-400">Loading Citizen Dashboard...</span>
      </div>
    );
  }

  // Get Priority badge colors
  const getPriorityColor = (severity) => {
    const sev = severity?.toUpperCase() || 'MEDIUM';
    switch (sev) {
      case 'CRITICAL':
      case 'HIGH': 
        return 'bg-rose-950/40 border-rose-900/60 text-rose-400';
      case 'MEDIUM': 
        return 'bg-amber-950/40 border-amber-900/60 text-amber-400';
      default: 
        return 'bg-slate-900 border-slate-800 text-slate-400';
    }
  };

  // Get Status badge colors
  const getStatusColor = (status) => {
    const stat = status?.toUpperCase() || 'REPORTED';
    switch (stat) {
      case 'RESOLVED':
      case 'CLOSED':
        return 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400';
      case 'IN_PROGRESS':
        return 'bg-blue-950/40 border-blue-900/60 text-blue-400';
      case 'INVESTIGATING':
      case 'ASSIGNED':
        return 'bg-amber-950/40 border-amber-900/60 text-amber-400';
      case 'UNDER_REVIEW':
      case 'REPORTED':
      default:
        return 'bg-slate-900 border-slate-800 text-slate-400';
    }
  };

  // Timeline step order mapping
  const getStepState = (stepIndex, status) => {
    const statusUpper = status?.toUpperCase() || 'REPORTED';
    
    // Status orders:
    // 0: REPORTED
    // 1: UNDER_REVIEW
    // 2: INVESTIGATING / ASSIGNED
    // 3: IN_PROGRESS
    // 4: RESOLVED / CLOSED
    const statusOrder = {
      'REPORTED': 0,
      'UNDER_REVIEW': 1,
      'INVESTIGATING': 2,
      'ASSIGNED': 2,
      'IN_PROGRESS': 3,
      'RESOLVED': 4,
      'CLOSED': 4
    };
    
    const currentOrder = statusOrder[statusUpper] !== undefined ? statusOrder[statusUpper] : 0;
    
    if (stepIndex < currentOrder) {
      return 'completed';
    } else if (stepIndex === currentOrder) {
      return 'active';
    } else {
      return 'pending';
    }
  };

  const activeReportsCount = Math.max(0, (data?.reportsSubmitted || 0) - (data?.reportsResolved || 0));
  const awaitingActionCount = data?.recentReports?.filter(r => ['REPORTED', 'UNDER_REVIEW'].includes(r.status?.toUpperCase())).length || 0;
  const mostRecentReport = data?.recentReports && data.recentReports.length > 0 ? data.recentReports[0] : null;

  return (
    <div className="space-y-6 text-slate-200">
      
      {/* Top Banner section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Welcome back, {data?.name || 'Citizen'}</h2>
          <p className="text-xs text-slate-450 mt-1 font-medium">Here's the latest status of your civic reports.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate('/analyze')}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-955 text-xs font-bold py-2.5 px-4 rounded-xl shadow active:scale-[0.99]"
          >
            Report New Issue
          </Button>
          <Button
            onClick={() => navigate('/track')}
            variant="outline"
            className="text-xs font-bold py-2.5 px-4 border-slate-800 text-slate-350 hover:bg-slate-850 rounded-xl"
          >
            Track Report
          </Button>
        </div>
      </div>

      {/* Grid: Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Reports */}
        <Card className="p-4 bg-slate-900/30 border-slate-850 flex items-center gap-4 shadow-md">
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl">
            <Activity size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Active Reports</span>
            <span className="text-xl font-black text-white">{activeReportsCount}</span>
          </div>
        </Card>

        {/* Resolved Reports */}
        <Card className="p-4 bg-slate-900/30 border-slate-850 flex items-center gap-4 shadow-md">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-450 rounded-xl">
            <CheckCircle size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Resolved Reports</span>
            <span className="text-xl font-black text-white">{data?.reportsResolved || 0}</span>
          </div>
        </Card>

        {/* Reports Awaiting Action */}
        <Card className="p-4 bg-slate-900/30 border-slate-850 flex items-center gap-4 shadow-md">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Awaiting Action</span>
            <span className="text-xl font-black text-white">{awaitingActionCount}</span>
          </div>
        </Card>

        {/* Average Resolution Time */}
        <Card className="p-4 bg-slate-900/30 border-slate-850 flex items-center gap-4 shadow-md">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-xl">
            <Zap size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Avg Resolution Time</span>
            <span className="text-xl font-black text-white">2.4 Days</span>
          </div>
        </Card>
      </div>

      {/* Main Dashboard Workspace split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Recent Reports Table */}
        <div id="reports-section" className="lg:col-span-8 space-y-6">
          <Card className="p-5 bg-slate-900/30 border-slate-850 shadow-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-3">
              <FileText size={14} className="text-emerald-500" />
              Your Recent Reports
            </h3>

            {(!data?.recentReports || data.recentReports.length === 0) ? (
              <div className="text-center py-12 space-y-4 animate-scale-in max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-850 text-slate-500 flex items-center justify-center mx-auto">
                  <FileText size={22} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-white">No reports yet</h4>
                  <p className="text-[10px] text-slate-450 leading-normal max-w-xs mx-auto font-medium">
                    Start improving your community by reporting your first civic issue.
                  </p>
                </div>
                <div className="pt-2">
                  <Button 
                    onClick={() => navigate('/analyze')}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-955 text-xs py-2 font-bold rounded-xl active:scale-[0.99]"
                  >
                    Report Your First Issue
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                      <th className="py-2.5 pr-4">Issue</th>
                      <th className="py-2.5 px-4 hidden md:table-cell">Location</th>
                      <th className="py-2.5 px-4 hidden sm:table-cell">Report ID</th>
                      <th className="py-2.5 px-4 hidden lg:table-cell">Submitted</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Priority</th>
                      <th className="py-2.5 pl-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentReports.map(report => (
                      <tr 
                        key={report.id} 
                        className="border-b border-slate-850/50 hover:bg-slate-950/20 transition-all font-medium text-slate-350"
                      >
                        <td className="py-3 pr-4 font-bold text-slate-200 truncate max-w-[120px]">{report.title}</td>
                        <td className="py-3 px-4 hidden md:table-cell truncate max-w-[140px]">
                          <span className="flex items-center gap-1">
                            <MapPin size={11} className="text-slate-500" />
                            {report.address || 'City Limits'}
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell font-mono text-[10px] text-slate-500">
                          {report.trackingId || report.id?.substring(0, 8).toUpperCase() || 'N/A'}
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell text-slate-500">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getStatusColor(report.status)}`}>
                            {report.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getPriorityColor(report.severity)}`}>
                            {report.severity || 'MEDIUM'}
                          </span>
                        </td>
                        <td className="py-3 pl-4 text-right">
                          <button
                            onClick={() => navigate(`/incidents/${report.id}`)}
                            className="p-1 rounded-lg text-slate-500 hover:text-emerald-450 hover:bg-slate-850/40 transition-all"
                            title="View Incident Details"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Timeline, Actions, and Notifications */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Vertical Report Timeline */}
          {mostRecentReport && (
            <Card className="p-5 bg-slate-900/30 border-slate-850 shadow-2xl space-y-4">
              <div className="border-b border-slate-850 pb-2.5">
                <span className="text-[9px] font-bold text-slate-550 uppercase tracking-widest block leading-none">Latest Report Timeline</span>
                <span className="text-xs font-extrabold text-white block mt-1 truncate">{mostRecentReport.title}</span>
              </div>

              <div className="space-y-4.5 pl-2 relative pt-1">
                
                {/* Timeline vertical bar */}
                <div className="absolute top-2.5 bottom-2.5 left-4 w-0.5 bg-slate-850" />

                {[
                  { title: 'Submitted', desc: 'Report successfully registered.' },
                  { title: 'AI Analysis', desc: 'Gemini Vision diagnostics verified.' },
                  { title: 'Department Assigned', desc: 'Dispatched to department queue.' },
                  { title: 'Under Inspection', desc: 'Field teams inspecting damages.' },
                  { title: 'Resolved', desc: 'Closing resolution confirmed.' }
                ].map((step, idx) => {
                  const state = getStepState(idx, mostRecentReport.status);
                  
                  return (
                    <div key={idx} className="flex gap-3 relative items-start group">
                      
                      {/* Timeline dot state */}
                      <div className="z-10 shrink-0 mt-0.5">
                        {state === 'completed' ? (
                          <div className="w-8 h-8 rounded-full bg-emerald-950/80 border border-emerald-500 text-emerald-400 flex items-center justify-center shadow shadow-emerald-500/10">
                            <CheckCircle size={14} />
                          </div>
                        ) : state === 'active' ? (
                          <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-955 flex items-center justify-center font-bold text-xs shadow-md shadow-emerald-500/20 animate-pulse border border-emerald-400">
                            <Clock size={14} />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-850 text-slate-600 flex items-center justify-center">
                            <Circle size={6} className="fill-slate-850" />
                          </div>
                        )}
                      </div>

                      {/* Content block */}
                      <div className="text-left space-y-0.5">
                        <span className={`block text-[11px] font-bold transition-colors ${
                          state === 'completed' ? 'text-emerald-400' : state === 'active' ? 'text-white' : 'text-slate-550'
                        }`}>
                          {step.title}
                        </span>
                        <span className="block text-[9px] text-slate-500 leading-normal font-semibold">
                          {step.desc}
                        </span>
                      </div>

                    </div>
                  );
                })}

              </div>
            </Card>
          )}

          {/* Quick Actions Shortcuts */}
          <Card className="p-5 bg-slate-900/30 border-slate-850 shadow-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-3">
              <Zap size={14} className="text-emerald-500" />
              Quick Actions
            </h3>

            <div className="flex flex-col gap-2 font-bold text-xs">
              <Button
                onClick={() => navigate('/analyze')}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-955 text-xs py-2 shadow-sm active:scale-95 border-0 w-full text-center"
              >
                Report New Issue
              </Button>
              
              <Button
                onClick={() => navigate('/track')}
                variant="outline"
                className="border-slate-800 hover:bg-slate-850 text-slate-350 text-xs py-2 active:scale-95 shadow-sm w-full"
              >
                Track Existing Report
              </Button>
              
              <Button
                onClick={() => {
                  const elem = document.getElementById('reports-section');
                  if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                }}
                variant="outline"
                className="border-slate-800 hover:bg-slate-850 text-slate-350 text-xs py-2 active:scale-95 shadow-sm w-full"
              >
                View All Reports
              </Button>

              <Button
                onClick={() => navigate('/settings')}
                variant="outline"
                className="border-slate-800 hover:bg-slate-850 text-slate-350 text-xs py-2 active:scale-95 shadow-sm w-full"
              >
                Edit Profile
              </Button>
            </div>
          </Card>

          {/* Notifications Card */}
          <Card className="p-5 bg-slate-900/30 border-slate-850 shadow-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-3">
              <Bell size={14} className="text-emerald-500" />
              Recent Alerts & Updates
            </h3>

            <div className="space-y-3 font-semibold text-[10px] leading-relaxed text-slate-400">
              {(!data?.activityTimeline || data.activityTimeline.length === 0) ? (
                <p className="text-center py-6 text-slate-500 font-medium">No recent logs to display.</p>
              ) : (
                data.activityTimeline.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-2.5 bg-slate-950/40 border border-slate-850/60 rounded-lg flex gap-2 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5 animate-pulse" />
                    <div>
                      <p className="text-slate-300">{log.description}</p>
                      <span className="block text-[8px] text-slate-550 mt-1 font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

        </div>

      </div>

    </div>
  );
}
