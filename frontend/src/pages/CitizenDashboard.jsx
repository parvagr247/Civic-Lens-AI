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
  ArrowRight, Edit3, Search, User, Bell, Activity, Circle
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
        return 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400';
      case 'MEDIUM': 
        return 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-400';
      default: 
        return 'bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400';
    }
  };

  // Get Status badge colors
  const getStatusColor = (status) => {
    const stat = status?.toUpperCase() || 'REPORTED';
    switch (stat) {
      case 'RESOLVED':
      case 'CLOSED':
        return 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400';
      case 'IN_PROGRESS':
        return 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-400';
      case 'INVESTIGATING':
      case 'ASSIGNED':
        return 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-400';
      case 'UNDER_REVIEW':
      case 'REPORTED':
      default:
        return 'bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400';
    }
  };

  // Timeline step order mapping
  const getStepState = (stepIndex, status) => {
    const statusUpper = status?.toUpperCase() || 'REPORTED';
    
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
    <div className="space-y-6 text-foreground">
      
      {/* Top Banner section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Welcome back, {data?.name || 'Citizen'}</h2>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Here's the latest status of your civic reports.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate('/analyze')}
            variant="success"
            className="text-xs font-bold py-2.5 px-4 rounded-xl shadow active:scale-[0.99]"
          >
            Report New Issue
          </Button>
          <Button
            onClick={() => navigate('/track')}
            variant="outline"
            className="text-xs font-bold py-2.5 px-4 rounded-xl"
          >
            Track Report
          </Button>
        </div>
      </div>

      {/* Grid: Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Reports */}
        <Card className="p-4 bg-card border-border flex items-center gap-4 shadow-md">
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 text-blue-500 rounded-xl">
            <Activity size={20} />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold block">Active Reports</span>
            <span className="text-xl font-black text-foreground">{activeReportsCount}</span>
          </div>
        </Card>

        {/* Resolved Reports */}
        <Card className="p-4 bg-card border-border flex items-center gap-4 shadow-md">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle size={20} />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold block">Resolved Reports</span>
            <span className="text-xl font-black text-foreground">{data?.reportsResolved || 0}</span>
          </div>
        </Card>

        {/* Reports Awaiting Action */}
        <Card className="p-4 bg-card border-border flex items-center gap-4 shadow-md">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-550 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold block">Awaiting Action</span>
            <span className="text-xl font-black text-foreground">{awaitingActionCount}</span>
          </div>
        </Card>

        {/* Average Resolution Time */}
        <Card className="p-4 bg-card border-border flex items-center gap-4 shadow-md">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 rounded-xl">
            <Zap size={20} />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold block">Avg Resolution Time</span>
            <span className="text-xl font-black text-foreground">2.4 Days</span>
          </div>
        </Card>
      </div>

      {/* Main Dashboard Workspace split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Recent Reports Table */}
        <div id="reports-section" className="lg:col-span-8 space-y-6">
          <Card className="p-5 bg-card border-border shadow-2xl space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-3">
              <FileText size={14} className="text-emerald-500 dark:text-emerald-455" />
              Your Recent Reports
            </h3>

            {(!data?.recentReports || data.recentReports.length === 0) ? (
              <div className="text-center py-12 space-y-4 animate-scale-in max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-slate-950 border border-border text-muted-foreground flex items-center justify-center mx-auto">
                  <FileText size={22} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-foreground">No reports yet</h4>
                  <p className="text-[10px] text-muted-foreground leading-normal max-w-xs mx-auto font-medium">
                    Start improving your community by reporting your first civic issue.
                  </p>
                </div>
                <div className="pt-2">
                  <Button 
                    onClick={() => navigate('/analyze')}
                    variant="success"
                    className="w-full text-xs py-2 font-bold rounded-xl active:scale-[0.99]"
                  >
                    Report Your First Issue
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-bold uppercase text-[9px] tracking-wider">
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
                        className="border-b border-border/50 hover:bg-gray-50/50 dark:hover:bg-slate-950/20 transition-all font-medium text-gray-700 dark:text-slate-300"
                      >
                        <td className="py-3 pr-4 font-bold text-foreground truncate max-w-[120px]">{report.title}</td>
                        <td className="py-3 px-4 hidden md:table-cell truncate max-w-[140px]">
                          <span className="flex items-center gap-1">
                            <MapPin size={11} className="text-muted-foreground" />
                            {report.address || 'City Limits'}
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell font-mono text-[10px] text-muted-foreground">
                          {report.trackingId || report.id?.substring(0, 8).toUpperCase() || 'N/A'}
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${getStatusColor(report.status)}`}>
                            {report.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${getPriorityColor(report.severity)}`}>
                            {report.severity || 'MEDIUM'}
                          </span>
                        </td>
                        <td className="py-3 pl-4 text-right">
                          <button
                            onClick={() => navigate(`/incidents/${report.id}`)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-slate-800/60 transition-all"
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
            <Card className="p-5 bg-card border-border shadow-2xl space-y-4">
              <div className="border-b border-border pb-2.5">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block leading-none">Latest Report Timeline</span>
                <span className="text-xs font-extrabold text-foreground block mt-1 truncate">{mostRecentReport.title}</span>
              </div>

              <div className="space-y-4.5 pl-2 relative pt-1">
                
                {/* Timeline vertical bar */}
                <div className="absolute top-2.5 bottom-2.5 left-4 w-0.5 bg-border" />

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
                          <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow shadow-emerald-500/10">
                            <CheckCircle size={14} />
                          </div>
                        ) : state === 'active' ? (
                          <div className="w-8 h-8 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 flex items-center justify-center font-bold text-xs shadow-md shadow-emerald-500/20 animate-pulse border border-emerald-500 dark:border-emerald-400">
                            <Clock size={14} />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-950 border border-border text-muted-foreground flex items-center justify-center">
                            <Circle size={6} className="fill-gray-300 dark:fill-slate-800" />
                          </div>
                        )}
                      </div>

                      {/* Content block */}
                      <div className="text-left space-y-0.5">
                        <span className={`block text-[11px] font-bold transition-colors ${
                          state === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : state === 'active' ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {step.title}
                        </span>
                        <span className="block text-[9px] text-muted-foreground leading-normal font-semibold">
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
          <Card className="p-5 bg-card border-border shadow-2xl space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-3">
              <Zap size={14} className="text-emerald-500" />
              Quick Actions
            </h3>

            <div className="flex flex-col gap-2 font-bold text-xs">
              <Button
                onClick={() => navigate('/analyze')}
                variant="success"
                className="text-xs py-2 shadow-sm active:scale-95 border-0 w-full text-center"
              >
                Report New Issue
              </Button>
              
              <Button
                onClick={() => navigate('/track')}
                variant="outline"
                className="text-xs py-2 active:scale-95 shadow-sm w-full"
              >
                Track Existing Report
              </Button>
              
              <Button
                onClick={() => {
                  const elem = document.getElementById('reports-section');
                  if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                }}
                variant="outline"
                className="text-xs py-2 active:scale-95 shadow-sm w-full"
              >
                View All Reports
              </Button>

              <Button
                onClick={() => navigate('/settings')}
                variant="outline"
                className="text-xs py-2 active:scale-95 shadow-sm w-full"
              >
                Edit Profile
              </Button>
            </div>
          </Card>

          {/* Notifications Card */}
          <Card className="p-5 bg-card border-border shadow-2xl space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-3">
              <Bell size={14} className="text-emerald-500" />
              Recent Alerts & Updates
            </h3>

            <div className="space-y-3 font-semibold text-[10px] leading-relaxed text-muted-foreground">
              {(!data?.activityTimeline || data.activityTimeline.length === 0) ? (
                <p className="text-center py-6 text-muted-foreground font-medium">No recent logs to display.</p>
              ) : (
                data.activityTimeline.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-2.5 bg-gray-50/50 dark:bg-slate-950/40 border border-border rounded-lg flex gap-2 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5 animate-pulse" />
                    <div>
                      <p className="text-foreground/90">{log.description}</p>
                      <span className="block text-[8px] text-muted-foreground mt-1 font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
