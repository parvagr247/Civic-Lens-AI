import React, { useEffect, useState } from 'react';
import { getAllOfficers } from '../services/officerService';
import { getIncidentQueue } from '../services/adminService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { 
  Users, RefreshCw, Star, ShieldAlert, CheckCircle2, 
  MapPin, Clock, Award, ShieldCheck, Mail, Zap
} from 'lucide-react';
import { useToast } from '../components/ui/ToastProvider';

export default function Officers() {
  const { toast } = useToast();
  const [officers, setOfficers] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const officersRes = await getAllOfficers();
      const queueRes = await getIncidentQueue({ size: 250 }); // Fetch large batch to compute workloads

      if (officersRes.success) {
        setOfficers(officersRes.data || []);
      }
      if (queueRes.success && queueRes.data) {
        setQueue(queueRes.data.content || []);
      }
    } catch (err) {
      console.error(err);
      toast('Failed to load officer dispatch telemetry.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 py-6">
        <SkeletonLoader variant="text" count={1} className="w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonLoader variant="card" count={3} />
        </div>
      </div>
    );
  }

  // Compute live active cases and completed dispatches for each officer
  const activeCasesMap = {};
  const completedCasesMap = {};

  queue.forEach(item => {
    if (item.assignedOfficer && item.assignedOfficer !== 'Unassigned') {
      const name = item.assignedOfficer.trim();
      if (item.status === 'RESOLVED') {
        completedCasesMap[name] = (completedCasesMap[name] || 0) + 1;
      } else {
        activeCasesMap[name] = (activeCasesMap[name] || 0) + 1;
      }
    }
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4 animate-fade-in text-slate-200">
      
      {/* Title */}
      <div className="flex justify-between items-center border-b border-slate-850 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Field Officer Registry</h2>
          <p className="text-xs text-slate-450 mt-1 font-medium">
            Monitor municipal crews workload statistics, real-time availability status, and performance scorecards.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2.5 bg-slate-900 border border-slate-855 text-slate-400 hover:text-white rounded-xl transition-colors shadow shadow-slate-950 hover:bg-slate-850"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Officers Grid */}
      {officers.length === 0 ? (
        <Card className="p-8 text-center text-slate-500 font-bold">
          No registered officers found in system records.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {officers.map(officer => {
            const name = officer.name.trim();
            const activeCases = activeCasesMap[name] || 0;
            const completedToday = completedCasesMap[name] || 0;
            
            // Calculate workload percentage (max active workload baseline = 5 cases)
            const workloadPct = Math.min(100, Math.round((activeCases / 5) * 100));

            return (
              <Card key={officer.id} className="p-5 bg-slate-900/30 border-slate-850 space-y-5 shadow-md flex flex-col justify-between hover:border-slate-800 transition-colors group">
                
                {/* Profile Header */}
                <div className="flex items-start gap-4">
                  <img 
                    src={`https://api.dicebear.com/7.x/bottts/svg?seed=${officer.name}`}
                    alt={officer.name}
                    className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-850 object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-black text-white truncate">{officer.name}</h4>
                    <span className="text-[10px] text-slate-450 block truncate font-medium flex items-center gap-1 mt-0.5">
                      <Mail size={10} className="text-emerald-500" />
                      {officer.email}
                    </span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mt-1">
                      {officer.department}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase shrink-0 border ${
                    officer.active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-800'
                  }`}>
                    {officer.active ? 'Available' : 'Offline'}
                  </span>
                </div>

                {/* Performance & Cases Summary */}
                <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-slate-850/50">
                  <div className="p-2 bg-slate-955/30 border border-slate-850 rounded-xl text-center">
                    <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider block">Active Cases</span>
                    <span className="text-xs font-black text-white mt-1 block font-mono">{activeCases}</span>
                  </div>
                  <div className="p-2 bg-slate-955/30 border border-slate-850 rounded-xl text-center">
                    <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider block">Completed</span>
                    <span className="text-xs font-black text-emerald-500 mt-1 block font-mono">{completedToday}</span>
                  </div>
                  <div className="p-2 bg-slate-955/30 border border-slate-850 rounded-xl text-center">
                    <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider block">Performance</span>
                    <span className="text-xs font-black text-amber-500 mt-1 block font-mono flex items-center justify-center gap-0.5">
                      <Star size={9} className="fill-amber-500 text-amber-500" />
                      {officer.performanceScore ? officer.performanceScore.toFixed(1) : "5.0"}
                    </span>
                  </div>
                </div>

                {/* Workload Index Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-slate-500">
                    <span>Workload index</span>
                    <span>{workloadPct}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        workloadPct > 80 ? 'bg-rose-500' : workloadPct > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${workloadPct}%` }}
                    />
                  </div>
                </div>

              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
}
