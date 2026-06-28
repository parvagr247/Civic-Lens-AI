import React, { useEffect, useState } from 'react';
import { getAdminDashboard, updateIncidentStatus } from '../services/dashboardService';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { 
  FileText, AlertOctagon, TrendingUp, Users, RefreshCw, 
  Activity, Sparkles, Info, Loader2, ClipboardCheck, Clock
} from 'lucide-react';
import { useToast } from '../components/ui/ToastProvider';
import { useNavigate } from 'react-router-dom';

/**
 * AdminDashboard component.
 * Visual operational panel for managing city-wide dispatches, category spreads, and status flows.
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
      console.error('Failed to load admin metrics', err);
      toast('Failed to load operations dashboard.', 'error');
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
      const res = await updateIncidentStatus(incidentId, newStatus);
      if (res.success) {
        toast(`Incident status updated to ${newStatus}`, 'success');
        // Refresh dashboard data
        const refreshResponse = await getAdminDashboard();
        if (refreshResponse.success) {
          setData(refreshResponse.data);
        }
      }
    } catch (err) {
      console.error(err);
      toast('Failed to update status.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'RESOLVED': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/60';
      case 'INVESTIGATING': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60';
      case 'REPORTED':
      default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 py-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center">
          <SkeletonLoader variant="text" count={1} className="w-1/3" />
          <SkeletonLoader variant="text" count={1} className="w-12 h-8" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SkeletonLoader variant="card" count={4} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <SkeletonLoader variant="card" count={2} />
          </div>
          <div className="lg:col-span-5">
            <SkeletonLoader variant="card" count={2} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-slate-900 dark:text-slate-100">
      
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Municipal Operations & Dispatch</h2>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-1">Review aggregated Smart City complaints, risk levels, and dispatch priorities.</p>
        </div>
        <button
          onClick={fetchAdminData}
          className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350 dark:hover:text-white rounded-lg transition-colors shadow-sm"
          title="Refresh Operations"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Aggregate Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total reports */}
        <Card className="p-4 bg-white dark:bg-slate-900/30 border-slate-250 dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/50">
            <FileText size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Total Incidents</span>
            <span className="text-xl font-black text-slate-800 dark:text-white">{data?.totalIncidents || 0} Reports</span>
          </div>
        </Card>

        {/* Critical counts */}
        <Card className="p-4 bg-white dark:bg-slate-900/30 border-slate-250 dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-900/50">
            <AlertOctagon size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Critical / P1</span>
            <span className="text-xl font-black text-rose-600 dark:text-rose-400">{data?.criticalIncidents || 0} Locations</span>
          </div>
        </Card>

        {/* Risk Average index */}
        <Card className="p-4 bg-white dark:bg-slate-900/30 border-slate-250 dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
            <TrendingUp size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Average Risk</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{Math.round(data?.averageRisk || 0)} Index</span>
          </div>
        </Card>

        {/* Active citizens */}
        <Card className="p-4 bg-white dark:bg-slate-900/30 border-slate-250 dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 rounded-xl border border-violet-100 dark:border-violet-900/50">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Active Citizens</span>
            <span className="text-xl font-black text-slate-800 dark:text-white">{data?.activeCitizens || 0} Registries</span>
          </div>
        </Card>
      </div>

      {/* Grid splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Dispatch Worklist */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Activity size={14} className="text-emerald-500" />
              Incidents Dispatch Worklist
            </h3>

            {(!data?.recentUploads || data.recentUploads.length === 0) ? (
              <p className="text-slate-500 text-xs py-8 text-center">No reports filed currently.</p>
            ) : (
              <div className="space-y-3.5">
                {data.recentUploads.map(incident => (
                  <div key={incident.id} className="p-4 bg-slate-50 dark:bg-slate-950/30 border border-slate-150 dark:border-slate-850 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black border tracking-wider ${getStatusColor(incident.status)}`}>
                          {incident.status}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{incident.title}</h4>
                      </div>
                      <p className="text-[9.5px] text-slate-500 truncate">{incident.address}</p>
                      <p className="text-[9px] text-slate-450">Reported By: {incident.reportedBy}</p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                      {updatingId === incident.id ? (
                        <Loader2 size={16} className="animate-spin text-slate-400" />
                      ) : (
                        <select
                          value={incident.status}
                          onChange={(e) => handleStatusChange(incident.id, e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 rounded-lg py-1 px-2 focus:outline-none focus:border-emerald-500/50 cursor-pointer shadow-sm"
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
                        onClick={() => navigate(`/incidents/${incident.id}`)}
                        className="py-1 px-2.5 border-slate-200 dark:border-slate-800 text-[10px] font-bold"
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

        {/* Right: SVG Workload Charts & Guidelines */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Workload spreads */}
          <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
              <TrendingUp size={14} className="text-emerald-500" />
              Category Workload Spreads
            </h3>

            {/* Custom SVG Donut/Circle Chart to visualize spreads */}
            {data?.categoryCounts && Object.keys(data.categoryCounts).length > 0 && (
              <div className="flex items-center justify-center py-2 gap-6 bg-slate-50 dark:bg-slate-950/20 rounded-xl p-3 border border-slate-100 dark:border-slate-900">
                <svg className="w-24 h-24 transform -rotate-90 shrink-0" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="3" />
                  {/* Highlighted primary category circle segment */}
                  <circle 
                    cx="18" 
                    cy="18" 
                    r="15.915" 
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="3.2" 
                    strokeDasharray="60 40" 
                    strokeDashoffset="0" 
                    className="transition-all duration-1000"
                  />
                  {/* Secondary segment */}
                  <circle 
                    cx="18" 
                    cy="18" 
                    r="15.915" 
                    fill="none" 
                    stroke="#3b82f6" 
                    strokeWidth="3.2" 
                    strokeDasharray="25 75" 
                    strokeDashoffset="-60" 
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="text-[10px] space-y-1 font-bold text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500 block shrink-0" />
                    Potholes / Road Wear (60%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-blue-500 block shrink-0" />
                    Water Leaks (25%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-slate-300 dark:bg-slate-800 block shrink-0" />
                    Others (15%)
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {data?.categoryCounts && Object.entries(data.categoryCounts).map(([cat, val]) => {
                const total = data.totalIncidents || 1;
                const percent = Math.round((val / total) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider">{cat.replace(/_/g, ' ')}</span>
                      <span className="text-slate-800 dark:text-slate-200">{val} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden border border-slate-200 dark:border-transparent">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500 shadow" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Focus guidelines */}
          <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Sparkles size={14} className="text-emerald-500" />
              AI Operational Focus
            </h3>

            <div className="space-y-2.5">
              {data?.aiRecommendations?.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-950/30 border border-slate-150 dark:border-slate-850 rounded-xl hover:border-slate-250 dark:hover:border-slate-800 transition-colors">
                  <Info size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-[10px] text-slate-650 dark:text-slate-350 leading-relaxed font-semibold">{rec}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
