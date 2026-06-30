import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackIncident } from '../services/issueService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/ToastProvider';
import { 
  Search, Clock, CheckCircle2, AlertTriangle, MapPin, 
  Clipboard, ShieldAlert, Calendar, RefreshCw, FileText, 
  CheckCircle, AlertCircle, Circle, ArrowRight, Loader2,
  Building, Shield
} from 'lucide-react';

/**
 * AnonymousTracker Page.
 * Provides a simplified tracking dashboard for civic reports by Report ID.
 */
export default function AnonymousTracker() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [trackingId, setTrackingId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!trackingId.trim()) return;
    
    setLoading(true);
    setReport(null);
    setSearched(true);
    
    try {
      const res = await trackIncident(trackingId.trim());
      if (res.success && res.data) {
        setReport(res.data);
        toast('Report retrieved successfully!', 'success');
      } else {
        setReport(null);
        toast('Report not found.', 'error');
      }
    } catch (err) {
      setReport(null);
      toast('Search failed. Please verify the ID.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper to map category to a municipal department dynamically
  const getDepartment = (category) => {
    const cat = category?.toUpperCase() || '';
    if (cat.includes('ROAD') || cat.includes('POTHOLE')) return 'Department of Transportation';
    if (cat.includes('WASTE') || cat.includes('GARBAGE') || cat.includes('DUMPING')) return 'Department of Sanitation';
    if (cat.includes('WATER') || cat.includes('LEAK') || cat.includes('DRAIN')) return 'Department of Water Resources';
    if (cat.includes('LIGHT') || cat.includes('STREETLIGHT')) return 'Department of Public Utilities';
    if (cat.includes('TRAFFIC') || cat.includes('SIGNAL')) return 'Traffic Control Division';
    return 'Municipal Operations Department';
  };

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

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-8 animate-fade-in text-slate-200">
      
      {/* Search Console Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-white tracking-tight">Track Your Civic Report</h2>
        <p className="text-xs text-slate-450 max-w-sm mx-auto font-medium">
          Enter the unique Report ID you received after submitting your civic issue.
        </p>
      </div>

      {/* Main Tracking Console Card */}
      <Card className="p-6 bg-slate-900/35 border-slate-850 shadow-2xl space-y-6">
        
        <form onSubmit={handleLookup} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Report ID</label>
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="CL-2026-X83N2L"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/40 border border-slate-850 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:border-emerald-500/50 focus:ring-0 focus:outline-none transition-colors duration-205"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-955 text-sm py-3 font-bold rounded-xl active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Searching Archives...
              </>
            ) : (
              'Track Report'
            )}
          </Button>
        </form>

        <p className="text-[10px] text-slate-500 text-center font-medium">
          Your Report ID is generated automatically after a successful submission.
        </p>
      </Card>

      {/* Content viewport */}
      <div className="space-y-6">
        
        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 size={32} className="animate-spin text-emerald-450" />
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Resolving tracking details...</span>
          </div>
        )}

        {/* Found State: Report details and timeline */}
        {!loading && report && (
          <div className="space-y-6 animate-scale-in">
            
            {/* Green Success Badge if resolved */}
            {(report.status === 'RESOLVED' || report.status === 'CLOSED') && (
              <div className="flex items-center gap-2 p-3 bg-emerald-950/40 border border-emerald-900/60 rounded-xl text-emerald-400 text-xs font-bold shadow-md">
                <CheckCircle size={16} className="shrink-0" />
                <span>This civic issue has been resolved by municipal inspectors. Thank you for your reporting contribution!</span>
              </div>
            )}

            {/* Incident Details Card */}
            <Card className="p-6 bg-slate-900/35 border-slate-850 shadow-2xl space-y-6">
              
              <div className="flex justify-between items-start gap-4 border-b border-slate-850 pb-4">
                <div>
                  <Badge className="bg-slate-950 text-slate-450 border border-slate-850 text-[8px] font-black uppercase tracking-wider font-mono px-2 py-0.5">
                    REF: {report.trackingId || report.id?.substring(0, 8).toUpperCase() || 'CL-2026-X83N2L'}
                  </Badge>
                  <h3 className="text-base font-extrabold text-white mt-2">{report.title}</h3>
                </div>
                <Badge className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border ${getStatusColor(report.status)}`}>
                  {report.status?.replace('_', ' ')}
                </Badge>
              </div>

              {/* Grid Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Issue Category</span>
                  <span className="block text-slate-350">{report.category?.replace('_', ' ') || 'CIVIC_ANOMALY'}</span>
                </div>
                
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Priority / Severity</span>
                  <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold border ${getPriorityColor(report.severity)}`}>
                    {report.severity || 'MEDIUM'}
                  </span>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-850/40">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Reported Date</span>
                  <span className="block text-slate-350">{new Date(report.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-850/40">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Last Updated</span>
                  <span className="block text-slate-350">{new Date(report.updatedAt).toLocaleDateString()}</span>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-850/40 md:col-span-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Assigned Department</span>
                  <span className="block text-slate-300 font-semibold">{getDepartment(report.category)}</span>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-850/40 md:col-span-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Location Address</span>
                  <span className="block text-slate-350 flex items-center gap-1">
                    <MapPin size={12} className="text-emerald-500" />
                    {report.location?.address || 'City Limits'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl space-y-1.5">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Description Details</span>
                <p className="text-xs text-slate-350 leading-relaxed font-semibold">{report.description}</p>
              </div>

            </Card>

            {/* Vertical Progress Timeline */}
            <Card className="p-6 bg-slate-900/35 border-slate-850 shadow-2xl space-y-6">
              
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-3">
                <Clock size={14} className="text-emerald-500" />
                Dispatch & Resolution Timeline
              </h4>

              <div className="space-y-6 pl-2 relative">
                
                {/* Timeline vertical bar */}
                <div className="absolute top-3 bottom-3 left-4.5 w-0.5 bg-slate-850" />

                {[
                  { title: 'Report Submitted', desc: 'The issue has been registered in the municipal database.' },
                  { title: 'AI Analysis Completed', desc: 'Gemini Vision processed categories and evaluated priority indicators.' },
                  { title: 'Assigned to Department', desc: 'Dispatched to the relevant public service department board.' },
                  { title: 'Under Inspection', desc: 'Field inspectors are reviewing locations and site details.' },
                  { title: 'Resolved', desc: 'Resolution validated and repairs are completed.' }
                ].map((step, idx) => {
                  const state = getStepState(idx, report.status);
                  
                  return (
                    <div key={idx} className="flex gap-4 relative items-start group">
                      
                      {/* Timeline dot state */}
                      <div className="z-10 shrink-0">
                        {state === 'completed' ? (
                          <div className="w-9 h-9 rounded-full bg-emerald-950/80 border-2 border-emerald-500 text-emerald-450 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                            <CheckCircle2 size={16} />
                          </div>
                        ) : state === 'active' ? (
                          <div className="w-9 h-9 rounded-full bg-emerald-500 text-slate-955 flex items-center justify-center font-bold text-xs shadow-lg shadow-emerald-500/20 animate-pulse border-2 border-emerald-400">
                            <Clock size={16} />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-950 border-2 border-slate-800 text-slate-600 flex items-center justify-center font-bold text-xs">
                            <Circle size={8} className="fill-slate-800" />
                          </div>
                        )}
                      </div>

                      {/* Content block */}
                      <div className="pt-1 text-left space-y-0.5">
                        <span className={`block text-xs font-bold transition-colors ${
                          state === 'completed' ? 'text-emerald-400' : state === 'active' ? 'text-white' : 'text-slate-500'
                        }`}>
                          {step.title}
                        </span>
                        <span className="block text-[10px] text-slate-450 leading-relaxed font-semibold">
                          {step.desc}
                        </span>
                      </div>

                    </div>
                  );
                })}

              </div>

            </Card>

          </div>
        )}

        {/* Empty State: Not found after search */}
        {!loading && searched && !report && (
          <div className="bg-slate-900/20 border border-slate-850 p-8 rounded-2xl text-center space-y-4 animate-scale-in max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-rose-950/30 border border-rose-900/40 text-rose-500 flex items-center justify-center mx-auto">
              <AlertCircle size={22} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-white">Report Not Found</h4>
              <p className="text-[10px] text-slate-450 leading-normal max-w-xs mx-auto font-medium">
                We couldn't find a report with this ID. Please check the Report ID and try again.
              </p>
            </div>
            <div className="pt-2">
              <Button 
                onClick={() => navigate('/analyze')}
                className="w-full bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 text-xs py-2 font-bold rounded-xl active:scale-[0.99]"
              >
                Report New Issue
              </Button>
            </div>
          </div>
        )}

        {/* Initial/Static State: Don't have a report ID */}
        {!loading && !report && !searched && (
          <div className="text-center pt-4 space-y-4 border-t border-slate-850/40 max-w-md mx-auto">
            <h4 className="text-xs font-bold text-slate-400">Don't have a Report ID?</h4>
            <Button
              onClick={() => navigate('/analyze')}
              variant="outline"
              className="w-full text-xs font-bold py-2.5 rounded-xl border-slate-800 text-slate-350 hover:bg-slate-850 flex items-center justify-center gap-1.5"
            >
              Report New Issue
              <ArrowRight size={14} />
            </Button>
          </div>
        )}

      </div>

    </div>
  );
}
