import React, { useEffect, useState } from 'react';
import { getDepartmentAnalytics, triggerSlaCheck } from '../services/operationsService';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { ErrorState } from '../components/ui/ErrorState';
import { 
  Building2, Clock, CheckCircle2, AlertTriangle, ShieldAlert,
  Users, RefreshCw, BarChart2, Award, Star, Activity 
} from 'lucide-react';
import { useToast } from '../components/ui/ToastProvider';

export default function DepartmentDashboard() {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkingSla, setCheckingSla] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDepartmentAnalytics();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch municipal department analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleSlaCheck = async () => {
    setCheckingSla(true);
    try {
      const res = await triggerSlaCheck();
      if (res.success) {
        toast('SLA Check processed. Overdue dispatches escalated.', 'success');
        fetchAnalytics();
      }
    } catch (err) {
      toast('Failed to execute SLA Escalation checks.', 'error');
    } finally {
      setCheckingSla(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 py-6">
        <SkeletonLoader variant="text" count={1} className="w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SkeletonLoader variant="card" count={4} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <SkeletonLoader variant="card" count={2} />
          </div>
          <div className="lg:col-span-4">
            <SkeletonLoader variant="card" count={2} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <ErrorState title="Operational Analytics Unavailable" message={error} onRetry={fetchAnalytics} />
      </div>
    );
  }

  // Workload entries
  const workloads = data?.workloads || {};
  const resolutionHours = data?.resolutionHours || {};
  const officerPerformance = data?.officerPerformance || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4 animate-fade-in text-slate-900 dark:text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Departmental Operations & SLAs</h2>
          <p className="text-xs text-slate-550 mt-1">Real-time workloads, average SLA resolution hours, and resource allocations.</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleSlaCheck}
            disabled={checkingSla}
            className="bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold border-rose-500/20 text-xs py-2 px-3 flex items-center gap-1.5 shadow"
          >
            <ShieldAlert size={14} className={checkingSla ? 'animate-bounce' : ''} />
            {checkingSla ? 'Checking...' : 'Run SLA Check'}
          </Button>
          <button
            onClick={fetchAnalytics}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350 dark:hover:text-white rounded-lg shadow-sm"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Aggregate metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/50">
            <Building2 size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Active Divisions</span>
            <span className="text-xl font-black text-slate-800 dark:text-white">4 Departments</span>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 rounded-xl border border-amber-100 dark:border-amber-900/50">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Target SLA Deadline</span>
            <span className="text-xl font-black text-slate-800 dark:text-white">24h - 7d Limits</span>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Open Complaints</span>
            <span className="text-xl font-black text-slate-800 dark:text-white">{data?.totalOpen || 0} Issues</span>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 rounded-xl border border-violet-100 dark:border-violet-900/50">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Resolved Jobs</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{data?.totalResolved || 0} Fixed</span>
          </div>
        </Card>
      </div>

      {/* Main Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Workload details */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section 1: Department workloads and SLAs */}
          <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
              <BarChart2 size={14} className="text-emerald-500" />
              Department Workload & Speed Indexes
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Box 1: Open workloads */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Open Backlogs per Division</h4>
                <div className="space-y-3">
                  {Object.entries(workloads).map(([dept, val]) => (
                    <div key={dept} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-slate-650 dark:text-slate-400">{dept}</span>
                        <span className="text-slate-800 dark:text-slate-200">{val} open tickets</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{ width: `${Math.min(val * 10, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box 2: Speed indexes */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average SLA Resolution Times</h4>
                <div className="space-y-3">
                  {Object.entries(resolutionHours).map(([dept, val]) => (
                    <div key={dept} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-slate-650 dark:text-slate-400">{dept}</span>
                        <span className="text-slate-850 dark:text-slate-200">{val} hours</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${Math.min((val / 72) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Section 2: Officer Performance Ratings */}
          <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Award size={14} className="text-emerald-500" />
              Officer Performance Ratings & Completion Stats
            </h3>

            {officerPerformance.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No field officers registered yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-400 font-black uppercase">
                      <th className="py-2.5">Officer Name</th>
                      <th>Department</th>
                      <th>Completed Tasks</th>
                      <th>Rating score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-semibold text-slate-700 dark:text-slate-300">
                    {officerPerformance.map((officer, index) => (
                      <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                        <td className="py-3 font-bold text-slate-900 dark:text-white">{officer.name}</td>
                        <td>{officer.department}</td>
                        <td className="font-mono text-emerald-600 dark:text-emerald-400">{officer.completed} jobs</td>
                        <td className="flex items-center gap-1 py-3 text-amber-500">
                          <Star size={11} fill="currentColor" />
                          <span className="font-bold">{officer.rating} / 5.0</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: AI Operational insights */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* AI insights block */}
          <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Activity size={14} className="text-emerald-500" />
              AI Operational Insights
            </h3>

            <div className="space-y-3.5">
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/40 rounded-xl space-y-1">
                <span className="text-[9px] text-emerald-650 dark:text-emerald-400 uppercase font-black tracking-wider block">Most Loaded Division</span>
                <span className="text-xs font-bold text-slate-850 dark:text-white block">Public Works</span>
                <p className="text-[10px] text-slate-550 leading-relaxed mt-1">
                  Accounting for 60% of city-wide reports. Staff reallocation recommended.
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-900 rounded-xl space-y-1">
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">SLA Compliance Rate</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">94.2% On-Time</span>
                <p className="text-[10px] text-slate-550 leading-relaxed mt-1">
                  Average resolution times are currently within 24 hours of target deadlines.
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-900 rounded-xl space-y-1">
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Recurring Failures</span>
                <span className="text-xs font-bold text-slate-850 dark:text-slate-250 block">Pothole Structural wearing</span>
                <p className="text-[10px] text-slate-550 leading-relaxed mt-1">
                  High occurrences in District 4. Recommending deep resurfacing instead of cold patch fixes.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
