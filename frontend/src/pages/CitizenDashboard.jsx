import React, { useEffect, useState } from 'react';
import { getCitizenDashboard } from '../services/dashboardService';
import '../styles/dashboard/CitizenDashboard.css';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Award, Flame, CheckCircle, FileText, MapPin, Sparkles, Trophy, Calendar, Eye, Shield } from 'lucide-react';
import { useToast } from '../components/ui/ToastProvider';

/**
 * CitizenDashboard component.
 * Displays profile credentials, leaderboard podium, weekly SVG charts, and personal incidents.
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

  // Fallback charts heights calculation
  const getWeeklyMax = () => {
    if (!data?.weeklyActivity) return 1;
    const vals = Object.values(data.weeklyActivity);
    return Math.max(...vals, 1);
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

  return (
    <div className="space-y-6">
      
      {/* Welcome Card & Citizen Profile Overview */}
      <Card className="p-6 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <img 
            src={data?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=fallback'} 
            alt="Citizen Avatar" 
            className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 p-1 shrink-0 shadow-lg"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Welcome back, {data?.name || 'Citizen'}</h2>
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 rounded text-[9px] font-black uppercase tracking-wider">
                {data?.level || 'New Citizen'}
              </span>
            </div>
            <p className="text-xs text-slate-650 dark:text-slate-400 leading-normal max-w-md">{data?.bio}</p>
          </div>
        </div>

        <Button
          onClick={() => navigate('/analyze')}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold self-start md:self-auto flex items-center gap-1.5"
        >
          <Sparkles size={14} />
          Report Civic Issue
        </Button>
      </Card>

      {/* Grid: Stats Widget */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Points */}
        <Card className="p-4 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 text-emerald-650 dark:text-emerald-400 rounded-xl">
            <Flame size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">Contribution Score</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{data?.points || 0} XP</span>
          </div>
        </Card>

        {/* Level Rank */}
        <Card className="p-4 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/60 text-amber-650 dark:text-amber-400 rounded-xl">
            <Trophy size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">Leaderboard Rank</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">#{data?.rank || 1} Rank</span>
          </div>
        </Card>

        {/* Reports Submitted */}
        <Card className="p-4 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 rounded-xl">
            <FileText size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">Issues Reported</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{data?.reportsSubmitted || 0} Filed</span>
          </div>
        </Card>

        {/* Resolved */}
        <Card className="p-4 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 text-emerald-655 dark:text-emerald-400 rounded-xl">
            <CheckCircle size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">Issues Resolved</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{data?.reportsResolved || 0} Fixed</span>
          </div>
        </Card>
      </div>

      {/* Main Grid Splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Recent Issues and Activity charts */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Recent Reports */}
          <div className="bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-2">
              <FileText size={14} className="text-emerald-500 dark:text-emerald-400" />
              Your Recent Reports
            </h3>

            {(!data?.recentReports || data.recentReports.length === 0) ? (
              <div className="text-center py-8 space-y-3">
                <p className="text-xs text-slate-500">You haven't reported any civic issues yet.</p>
                <Button 
                  onClick={() => navigate('/analyze')}
                  className="bg-white border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 text-xs hover:bg-slate-50"
                >
                  Report First Issue
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentReports.map(report => (
                  <div 
                    key={report.id} 
                    onClick={() => navigate(`/incidents/${report.id}`)}
                    className="p-3.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-xl hover:border-slate-350 dark:hover:border-slate-750 transition-all duration-200 flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{report.title}</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                        <MapPin size={10} />
                        {report.address}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Charts (Custom SVG Weekly Bar Chart) */}
          <div className="bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-2">
              <Calendar size={14} className="text-emerald-500 dark:text-emerald-400" />
              Your Reporting Velocity (Weekly)
            </h3>
            
            <div className="flex items-end justify-between h-40 pt-4 px-2 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-slate-150 dark:border-slate-900">
              {data?.weeklyActivity && Object.entries(data.weeklyActivity).map(([day, val]) => {
                const max = getWeeklyMax();
                const heightPercent = (val / max) * 80; // Cap height
                return (
                  <div key={day} className="flex flex-col items-center flex-1 group">
                    <span className="text-[9px] font-bold text-slate-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors duration-200 mb-1">
                      {val}
                    </span>
                    <div 
                      className={`w-5 rounded-t-sm transition-all duration-500 ${
                        val > 0 ? 'bg-emerald-500/70 group-hover:bg-emerald-500 shadow-lg' : 'bg-slate-200 dark:bg-slate-850'
                      }`}
                      style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    />
                    <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-2 block border-t border-slate-150 dark:border-slate-850/40 w-full text-center pt-1.5 uppercase">
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Leaderboard, Achievements, timeline */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Leaderboard Podium Preview */}
          <div className="bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-2">
              <Trophy size={14} className="text-emerald-500 dark:text-emerald-400" />
              Leaderboard Podium
            </h3>

            <div className="space-y-3">
              {!data?.leaderboardPreview || data.leaderboardPreview.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6 font-medium">
                  Be the first citizen to contribute and climb the leaderboard!
                </p>
              ) : (
                data.leaderboardPreview.map((entry, idx) => (
                  <div 
                    key={entry.userId}
                    onClick={() => navigate(`/profile/${entry.userId}`)}
                    className={`p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-500/35 transition-all ${
                      entry.userId === data.userId ? 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs font-black text-slate-400 min-w-4">{idx + 1}</span>
                      <img 
                        src={entry.avatarUrl} 
                        alt="Leaderboard User Avatar" 
                        className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{entry.name}</span>
                        <span className="block text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none mt-0.5">{entry.level}</span>
                      </div>
                    </div>
                    
                    <span className="text-xs font-black text-slate-550 dark:text-slate-350 shrink-0 font-mono">
                      {entry.points} XP
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Municipality Team Section */}
          {data?.administrativeTeam && data.administrativeTeam.length > 0 && (
            <div className="bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-2">
                <Shield size={14} className="text-emerald-500 dark:text-emerald-400" />
                Municipality Team
              </h3>

              <div className="space-y-3">
                {data.administrativeTeam.map((entry) => (
                  <div 
                    key={entry.userId}
                    className="p-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img 
                        src={entry.avatarUrl} 
                        alt="Staff Avatar" 
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{entry.name}</span>
                        <span className="block text-[8px] font-bold text-blue-650 dark:text-blue-400 uppercase tracking-widest leading-none mt-0.5">{entry.level}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider shrink-0">
                      Staff
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unlocked Achievements */}
          <div className="bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-2">
              <Award size={14} className="text-emerald-500 dark:text-emerald-400" />
              Badges & Achievements
            </h3>

            {(!data?.achievementsPreview || data.achievementsPreview.length === 0) ? (
              <p className="text-slate-500 text-xs py-4 text-center">No badges unlocked yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {data.achievementsPreview.map(ach => (
                  <div 
                    key={ach.id} 
                    className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl flex flex-col items-center justify-center text-center space-y-1.5 shadow-sm"
                  >
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                      <Award size={18} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate w-full">{ach.title}</span>
                    <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/35 px-1.5 py-0.5 rounded leading-none">
                      +{ach.pointsAwarded} XP
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
