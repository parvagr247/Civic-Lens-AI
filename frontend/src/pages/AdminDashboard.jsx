import React, { useEffect, useState } from 'react';
import { getAdminDashboard, updateIncidentStatus } from '../services/dashboardService';
import '../styles/dashboard/AdminDashboard.css';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck, Activity, Users, AlertOctagon, TrendingUp, Sparkles, RefreshCw, FileText, CheckCircle, Info } from 'lucide-react';
import { useToast } from '../components/ui/ToastProvider';

/**
 * AdminDashboard component.
 * Displays executive municipal diagnostics, incident status controls, and workload distributions.
 */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const response = await getAdminDashboard();
      if (response.success) {
        setData(response.data);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard', err);
      toast('Failed to load municipal analytics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleStatusChange = async (incidentId, newStatus) => {
    setUpdatingId(incidentId);
    try {
      const response = await updateIncidentStatus(incidentId, newStatus);
      if (response.success) {
        toast(`Incident status updated to ${newStatus}!`, 'success');
        // Refresh stats
        const refreshResponse = await getAdminDashboard();
        if (refreshResponse.success) {
          setData(refreshResponse.data);
        }
      }
    } catch (err) {
      console.error(err);
      toast('Failed to update status: ' + (err.message || err), 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'RESOLVED': return 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60';
      case 'IN_PROGRESS': return 'bg-blue-950/40 text-blue-400 border-blue-900/60';
      case 'INVESTIGATING': return 'bg-amber-950/40 text-amber-400 border-amber-900/60';
      case 'REPORTED':
      default: return 'bg-slate-900 text-slate-400 border-slate-800';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 size={32} className="animate-spin text-emerald-400" />
        <span className="text-sm text-slate-400">Loading Municipal Administration Panel...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-white">Municipal Operations & Dispatch</h2>
          <p className="text-xs text-slate-450 mt-1">Review aggregated Smart City complaints, risk levels, and dispatch priorities.</p>
        </div>
        <button
          onClick={fetchAdminData}
          className="p-2.5 bg-slate-900 border border-slate-800 text-slate-350 hover:text-white rounded-lg transition-colors duration-200"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Top Aggregated Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Incidents */}
        <Card className="p-4 bg-slate-900/30 border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-blue-950/40 border border-blue-900/60 text-blue-400 rounded-xl">
            <FileText size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">Total Incidents</span>
            <span className="text-xl font-black text-white">{data?.totalIncidents || 0} Reports</span>
          </div>
        </Card>

        {/* Critical Incidents */}
        <Card className="p-4 bg-slate-900/30 border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-rose-950/40 border border-rose-900/60 text-rose-400 rounded-xl">
            <AlertOctagon size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">Critical / P1</span>
            <span className="text-xl font-black text-white">{data?.criticalIncidents || 0} Locations</span>
          </div>
        </Card>

        {/* Avg Risk Score */}
        <Card className="p-4 bg-slate-900/30 border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 rounded-xl">
            <TrendingUp size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">Average Risk Index</span>
            <span className="text-xl font-black text-white">{Math.round(data?.averageRisk || 0)} Score</span>
          </div>
        </Card>

        {/* Active citizens */}
        <Card className="p-4 bg-slate-900/30 border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-blue-950/40 border border-blue-900/60 text-blue-400 rounded-xl">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">Active Citizens</span>
            <span className="text-xl font-black text-white">{data?.activeCitizens || 0} Registered</span>
          </div>
        </Card>
      </div>

      {/* Main Splits Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Recent Uploads worklist */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Activity size={14} className="text-emerald-400" />
              Incidents Dispatch Worklist
            </h3>

            {(!data?.recentUploads || data.recentUploads.length === 0) ? (
              <p className="text-slate-550 text-xs py-8 text-center">No reports filed currently.</p>
            ) : (
              <div className="space-y-3.5">
                {data.recentUploads.map(incident => (
                  <div key={incident.id} className="p-4 bg-slate-950/30 border border-slate-850 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getStatusColor(incident.status)}`}>
                          {incident.status}
                        </span>
                        <h4 className="text-xs font-bold text-slate-200 truncate">{incident.title}</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">{incident.address}</p>
                      <p className="text-[9px] text-slate-500">Reported By: {incident.reportedBy}</p>
                    </div>

                    {/* Status transition dropdown control */}
                    <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
                      {updatingId === incident.id ? (
                        <Loader2 size={16} className="animate-spin text-slate-450" />
                      ) : (
                        <select
                          value={incident.status}
                          onChange={(e) => handleStatusChange(incident.id, e.target.value)}
                          className="bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 rounded-lg py-1.5 px-2.5 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                        >
                          <option value="REPORTED">Reported</option>
                          <option value="INVESTIGATING">Investigating</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                        </select>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/risk-intelligence`)}
                        className="py-1 px-2 border-slate-800 text-[10px] flex items-center gap-1"
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: AI Recommendations and workloads */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Workload Categories Distribution */}
          <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <TrendingUp size={14} className="text-emerald-400" />
              Category Workload Spreads
            </h3>

            <div className="space-y-3">
              {data?.categoryCounts && Object.entries(data.categoryCounts).map(([cat, val]) => {
                const total = data.totalIncidents || 1;
                const percent = Math.round((val / total) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-semibold">
                      <span className="text-slate-400">{cat.replace(/_/g, ' ')}</span>
                      <span className="text-slate-200">{val} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Focus Guidelines */}
          <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Sparkles size={14} className="text-emerald-400" />
              AI Operational Focus
            </h3>

            <div className="space-y-2.5">
              {data?.aiRecommendations?.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2.5 bg-slate-950/30 border border-slate-850 rounded-lg hover:border-slate-800 transition-colors duration-200">
                  <Info size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-[10px] text-slate-350 leading-relaxed">{rec}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
