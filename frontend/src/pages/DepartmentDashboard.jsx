import React, { useEffect, useState } from 'react';
import { getAdminDashboard } from '../services/dashboardService';
import { getAllOfficers } from '../services/officerService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { 
  Building2, Users, RefreshCw, BarChart2, Star, 
  ChevronRight, ArrowUpRight, ShieldAlert, Award, ShieldCheck 
} from 'lucide-react';
import { useToast } from '../components/ui/ToastProvider';

export default function DepartmentDashboard() {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('Public Works');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const dashboardRes = await getAdminDashboard();
      const officersRes = await getAllOfficers();
      
      if (dashboardRes.success) {
        setData(dashboardRes.data);
      }
      if (officersRes.success) {
        setOfficers(officersRes.data || []);
      }
    } catch (err) {
      console.error(err);
      toast('Failed to fetch department metrics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 py-6">
        <SkeletonLoader variant="text" count={1} className="w-1/3" />
        <SkeletonLoader variant="card" count={3} />
      </div>
    );
  }

  // Workload distributions from Admin Dashboard
  const workloads = data?.departmentWorkload || {};

  // Standard Departments metadata
  const baseDepts = [
    { name: "Public Works", staff: 15, avgSla: "2.1 Days", perf: 4.8 },
    { name: "Sanitation", staff: 12, avgSla: "1.8 Days", perf: 4.6 },
    { name: "Water Division", staff: 10, avgSla: "2.5 Days", perf: 4.5 },
    { name: "Electrical Grid", staff: 8, avgSla: "1.2 Days", perf: 4.9 },
    { name: "Parks & Recreation", staff: 6, avgSla: "3.2 Days", perf: 4.2 },
    { name: "Traffic Control", staff: 9, avgSla: "1.5 Days", perf: 4.7 },
    { name: "Housing Authority", staff: 7, avgSla: "4.0 Days", perf: 4.1 },
    { name: "Environmental Health", staff: 5, avgSla: "2.8 Days", perf: 4.4 }
  ];

  // Map dynamic open counts and workload %
  const departmentsList = baseDepts.map(dept => {
    const openCases = workloads[dept.name] || 0;
    const maxCapacity = dept.staff * 3; // Baseline max capacity
    const currentLoad = Math.min(100, Math.round((openCases / maxCapacity) * 100));
    return {
      ...dept,
      openCases,
      currentLoad
    };
  });

  // Filter officers for currently selected department details
  const deptOfficers = officers.filter(o => o.department?.toLowerCase() === selectedDept.toLowerCase());

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4 animate-fade-in text-slate-200">
      
      {/* Title */}
      <div className="flex justify-between items-center border-b border-slate-850 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Department Management</h2>
          <p className="text-xs text-slate-450 mt-1 font-medium">
            Registry overview of municipal crews. Track personnel volumes, incident backlogs, and SLA response ratings.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="p-2.5 bg-slate-900 border border-slate-850 text-slate-400 hover:text-white rounded-xl transition-colors shadow shadow-slate-950"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Department Logistics Table */}
        <Card className="lg:col-span-8 p-5 bg-slate-900/30 border-slate-850 space-y-4 shadow-md">
          <h3 className="text-xs font-black tracking-wider uppercase text-slate-450 border-b border-slate-850 pb-2.5 flex items-center gap-1.5">
            <Building2 size={14} className="text-emerald-500 shrink-0" />
            Active Municipal Departments
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs select-none">
              <thead>
                <tr className="border-b border-slate-850 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900/10">
                  <th className="py-3.5 px-3">Department</th>
                  <th className="py-3.5 px-3 text-center">Open Cases</th>
                  <th className="py-3.5 px-3 text-center">Staff Available</th>
                  <th className="py-3.5 px-3 text-center">Avg SLA Speed</th>
                  <th className="py-3.5 px-3 text-center">Workload Index</th>
                  <th className="py-3.5 px-3 text-center">Performance</th>
                  <th className="py-3.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {departmentsList.map((dept) => {
                  const isSelected = dept.name === selectedDept;
                  return (
                    <tr
                      key={dept.name}
                      onClick={() => setSelectedDept(dept.name)}
                      className={`border-b border-slate-850/60 hover:bg-slate-900/40 cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3 font-bold text-white flex items-center gap-2">
                        <Building2 size={12} className="text-emerald-500 shrink-0" />
                        <span>{dept.name}</span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono font-black text-slate-300">
                        {dept.openCases}
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono font-semibold text-slate-400">
                        {dept.staff} Crews
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono font-semibold text-slate-400">
                        {dept.avgSla}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-16 bg-slate-900 h-1.5 rounded-full overflow-hidden shrink-0">
                            <div 
                              className={`h-full rounded-full ${
                                dept.currentLoad > 75 ? 'bg-rose-500' : dept.currentLoad > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${dept.currentLoad}%` }}
                            />
                          </div>
                          <span className="font-mono text-[9px] text-slate-400 font-bold w-6">{dept.currentLoad}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center font-semibold text-amber-500">
                        <div className="flex items-center justify-center gap-0.5">
                          <Star size={10} className="fill-amber-500 text-amber-500 shrink-0" />
                          <span>{dept.perf}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <ChevronRight size={14} className="text-slate-500 group-hover:text-white transition-colors ml-auto" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Right Column: Selected Department Details */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-5 bg-slate-900/30 border-slate-850 space-y-4 shadow-md">
            <h3 className="text-xs font-black tracking-wider uppercase text-white border-b border-slate-850 pb-2.5 flex items-center gap-1.5">
              <Users size={14} className="text-emerald-500 shrink-0" />
              {selectedDept} Personnel
            </h3>

            {deptOfficers.length === 0 ? (
              <p className="text-slate-500 text-xs py-8 text-center font-bold">No officers assigned currently.</p>
            ) : (
              <div className="space-y-3.5">
                {deptOfficers.map((off) => (
                  <div key={off.id} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center gap-3">
                    <img 
                      src={`https://api.dicebear.com/7.x/bottts/svg?seed=${off.name}`}
                      alt={off.name}
                      className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-850 shrink-0 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-white block truncate">{off.name}</span>
                      <span className="text-[10px] text-slate-500 block truncate">{off.email}</span>
                      <span className="text-[9px] font-bold text-emerald-400 font-mono mt-0.5 block">
                        Rating: {off.performanceScore ? off.performanceScore.toFixed(1) : "5.0"} ★
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase shrink-0 border ${
                      off.active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                    }`}>
                      {off.active ? 'Active' : 'Offline'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

      </div>

    </div>
  );
}
