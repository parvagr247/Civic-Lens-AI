import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { useToast } from '../components/ui/ToastProvider';
import { getLeaderboard } from '../services/leaderboardService';
import { getCurrentUser } from '../services/authService';
import { 
  Trophy, Search, Award, Calendar, Users, FileText, 
  CheckCircle, ChevronLeft, ChevronRight, MapPin, Eye, Loader2, Zap 
} from 'lucide-react';

/**
 * Leaderboard component.
 * Visual community rank showcase showing top citizens, filter scopes, and stats summaries.
 */
export default function Leaderboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  // API states
  const [podium, setPodium] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [currentUserEntry, setCurrentUserEntry] = useState(null);
  const [stats, setStats] = useState({
    totalCitizens: 0,
    totalReports: 0,
    totalResolved: 0,
    averageResolutionTime: 'N/A',
    totalXpEarned: 0
  });

  // Query states
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Filters states
  const [timeframe, setTimeframe] = useState('all'); // all, week, month
  const [cityScope, setCityScope] = useState('global'); // global, my_city
  const [sortBy, setSortBy] = useState('points'); // points, verified, resolved
  const [searchQuery, setSearchQuery] = useState('');
  const [debounceQuery, setDebounceQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounceQuery(searchQuery);
      setPage(0); // reset page
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadLeaderboardData = async () => {
    setLoading(true);
    try {
      // Determine city filter parameter
      let cityFilter = '';
      if (cityScope === 'my_city') {
        // If my_city scope, we filter by the logged-in user's city.
        // We will fallback to a default if they don't have one set,
        // or check the user entry once loaded.
        cityFilter = currentUserEntry?.city || 'Portland';
      }

      const res = await getLeaderboard({
        page,
        size: 10,
        city: cityFilter,
        timeframe,
        sortBy,
        query: debounceQuery
      });

      if (res.success && res.data) {
        const d = res.data;
        setPodium(d.podium || []);
        setContributors(d.topTen || []);
        setCurrentUserEntry(d.currentUserEntry);
        setStats({
          totalCitizens: d.totalCitizens,
          totalReports: d.totalReports,
          totalResolved: d.totalResolved,
          averageResolutionTime: d.averageResolutionTime,
          totalXpEarned: d.totalXpEarned
        });
        setTotalPages(d.totalPages);
        setTotalElements(d.totalElements);
      }
    } catch (err) {
      console.error(err);
      toast('Failed to query leaderboard records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboardData();
  }, [page, timeframe, cityScope, sortBy, debounceQuery]);

  const getReputationColor = (level) => {
    switch (level) {
      case 'Smart City Champion': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'AI Civic Ambassador': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Urban Hero': return 'bg-rose-500/10 text-rose-455 border-rose-500/20';
      case 'City Guardian': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Community Helper': return 'bg-teal-505/10 text-teal-400 border-teal-500/20';
      case 'Active Citizen': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'New Citizen':
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  // Re-order podium entries to put 1st place in the middle (2nd, 1st, 3rd)
  const getPodiumOrder = () => {
    if (podium.length === 0) return [];
    const ordered = [];
    if (podium.length > 1) ordered.push(podium[1]); // 2nd Place
    if (podium.length > 0) ordered.push(podium[0]); // 1st Place
    if (podium.length > 2) ordered.push(podium[2]); // 3rd Place
    return ordered;
  };

  // Check if current user is in the displayed paginated list
  const isCurrentUserInList = contributors.some(c => c.userId === currentUser?.userId);

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4 animate-fade-in text-slate-200">
      
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Community Leaderboard</h2>
        <p className="text-xs text-slate-450 mt-1 font-medium">
          Discover and connect with top citizen contributors working together to improve municipal services and neighborhoods.
        </p>
      </div>

      {/* Community Stats Dashboard Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Citizens', value: stats.totalCitizens, icon: Users, color: 'text-blue-500' },
          { label: 'Total Reports', value: stats.totalReports, icon: FileText, color: 'text-amber-500' },
          { label: 'Total Resolved', value: stats.totalResolved, icon: CheckCircle, color: 'text-emerald-500' },
          { label: 'Avg SLA Speed', value: stats.averageResolutionTime, icon: Calendar, color: 'text-indigo-500' },
          { label: 'Total XP Earned', value: `${stats.totalXpEarned.toLocaleString()} XP`, icon: Trophy, color: 'text-yellow-500' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="p-4 bg-slate-900/30 border-slate-850 flex flex-col justify-between h-20 shadow-sm relative overflow-hidden">
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{stat.label}</span>
              <div className="flex items-end justify-between mt-1">
                <span className="text-sm font-black text-white">{stat.value}</span>
                <Icon size={14} className={stat.color} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Visual Podium Highlights */}
      {!loading && podium.length > 0 && (
        <div className="flex flex-col items-center pt-4">
          <div className="flex justify-center items-end gap-3 md:gap-6 w-full max-w-2xl px-4 select-none">
            {getPodiumOrder().map((user) => {
              const isFirst = user.rank === 1;
              const isSecond = user.rank === 2;
              const isThird = user.rank === 3;

              return (
                <div 
                  key={user.userId} 
                  onClick={() => navigate(`/profile/${user.userId}`)}
                  className={`flex flex-col items-center flex-1 cursor-pointer transition-all duration-300 hover:scale-[1.03] group ${
                    isFirst ? 'z-10' : ''
                  }`}
                >
                  {/* Avatar bubble */}
                  <div className="relative flex flex-col items-center">
                    {/* Crown or Podium Badge */}
                    {isFirst && <Trophy className="text-yellow-500 w-6 h-6 absolute -top-5 drop-shadow animate-bounce" />}
                    
                    <div className={`rounded-full p-1 bg-slate-950 border-2 ${
                      isFirst ? 'w-16 h-16 md:w-20 md:h-20 border-yellow-500 shadow-lg shadow-yellow-500/10' :
                      isSecond ? 'w-12 h-12 md:w-16 md:h-16 border-slate-400' :
                      'w-10 h-10 md:w-14 md:h-14 border-orange-500'
                    }`}>
                      <img 
                        src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.userId}`}
                        alt={user.name} 
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    
                    <span className={`absolute -bottom-2 px-1.5 py-0.5 rounded-full text-[8px] font-black text-slate-950 shadow border ${
                      isFirst ? 'bg-yellow-500 border-yellow-405' :
                      isSecond ? 'bg-slate-350 border-slate-400' :
                      'bg-orange-400 border-orange-500'
                    }`}>
                      #{user.rank}
                    </span>
                  </div>

                  {/* Visual Podium Base */}
                  <div className={`w-full mt-4 flex flex-col items-center justify-end p-3 rounded-t-2xl border-t border-x relative overflow-hidden ${
                    isFirst 
                      ? 'h-32 md:h-40 bg-gradient-to-b from-yellow-500/10 to-yellow-500/[0.01] border-yellow-500/20' 
                      : isSecond 
                      ? 'h-24 md:h-32 bg-gradient-to-b from-slate-500/10 to-slate-500/[0.01] border-slate-555/20' 
                      : 'h-20 md:h-28 bg-gradient-to-b from-orange-500/10 to-orange-500/[0.01] border-orange-555/20'
                  }`}>
                    <div className="text-center space-y-0.5">
                      <span className="text-[10px] md:text-xs font-black text-white group-hover:underline block truncate max-w-[90px] md:max-w-[120px]">
                        {user.name}
                      </span>
                      <span className="text-[7.5px] md:text-[9px] text-slate-500 font-bold block flex items-center justify-center gap-0.5">
                        <MapPin size={8} /> {user.city}
                      </span>
                      <span className={`inline-block px-1.5 py-0.2 rounded text-[7px] md:text-[8px] font-bold border uppercase mt-1 ${getReputationColor(user.level)}`}>
                        {user.level.split(' ')[0]}
                      </span>
                      <span className="text-[9px] md:text-[10px] font-black text-emerald-500 block pt-1 font-mono">
                        {user.points.toLocaleString()} XP
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Query Search, Filters, and Ranking Logic description */}
      <Card className="p-6 bg-slate-900/30 border-slate-850 space-y-6 shadow-md">
        
        {/* Filters and Search toolbar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center w-full">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search citizens by name or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/40 border border-slate-850 rounded-xl pl-9 pr-4 py-2 text-xs focus:border-emerald-500/50 focus:outline-none placeholder-slate-500 text-slate-200"
            />
          </div>

          {/* Filtering buttons */}
          <div className="flex flex-wrap gap-2 items-center w-full md:w-auto justify-end">
            
            {/* Timeframe selector */}
            <div className="flex bg-slate-950/50 border border-slate-850 p-0.5 rounded-xl text-[10px] font-bold">
              {[
                { id: 'all', label: 'All Time' },
                { id: 'month', label: 'This Month' },
                { id: 'week', label: 'This Week' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setTimeframe(t.id); setPage(0); }}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    timeframe === t.id 
                      ? 'bg-slate-850 text-emerald-400 border border-slate-750 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-300 border border-transparent'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Scope selector */}
            <div className="flex bg-slate-950/50 border border-slate-850 p-0.5 rounded-xl text-[10px] font-bold">
              {[
                { id: 'global', label: 'Global' },
                { id: 'my_city', label: 'My City' }
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { setCityScope(s.id); setPage(0); }}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    cityScope === s.id 
                      ? 'bg-slate-850 text-emerald-400 border border-slate-750 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-300 border border-transparent'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Sorting criteria */}
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(0); }}
              className="bg-slate-950/50 border border-slate-850 text-[10px] font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-500/50 text-slate-350"
            >
              <option value="points">Sort by XP points</option>
              <option value="resolved">Sort by reports resolved</option>
              <option value="verified">Sort by accuracy rate</option>
            </select>
          </div>
        </div>

        {/* Dynamic Leaderboard table */}
        <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950/10">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-850 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900/10">
                <th className="py-3.5 px-4 text-center w-14">Rank</th>
                <th className="py-3.5 px-4">Citizen</th>
                <th className="py-3.5 px-4">City</th>
                <th className="py-3.5 px-4">Reputation Tier</th>
                <th className="py-3.5 px-4 text-center">Submitted</th>
                <th className="py-3.5 px-4 text-center">Resolved</th>
                <th className="py-3.5 px-4 text-center">Accuracy</th>
                <th className="py-3.5 px-4 text-center">Badges</th>
                <th className="py-3.5 px-4 text-center">Streak</th>
                <th className="py-3.5 px-4 text-right w-24">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-10 text-center">
                    <Loader2 size={24} className="animate-spin text-emerald-500 mx-auto" />
                    <span className="text-[10px] text-slate-500 mt-2 block">Compiling rankings...</span>
                  </td>
                </tr>
              ) : contributors.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-10 text-center text-slate-550 font-bold">
                    No active contributors match your search filters.
                  </td>
                </tr>
              ) : (
                contributors.map((user) => {
                  const isSelf = user.userId === currentUser?.userId;
                  return (
                    <tr 
                      key={user.userId}
                      onClick={() => navigate(`/profile/${user.userId}`)}
                      className={`border-b border-slate-850 hover:bg-slate-900/40 cursor-pointer transition-colors group ${
                        isSelf ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-black">
                        {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : `#${user.rank}`}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                        <img 
                          src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.userId}`}
                          alt={user.name} 
                          className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-850 shrink-0 object-cover"
                        />
                        <span className="group-hover:underline">{user.name}</span>
                        {isSelf && (
                          <span className="px-1.5 py-0.2 rounded text-[7px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 ml-1 shrink-0">
                            YOU
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-350">{user.city}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase tracking-wider ${getReputationColor(user.level)}`}>
                          {user.level}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-300">{user.reportsSubmitted}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-500">{user.reportsResolved}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-300">{user.accuracyRate}%</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-300">{user.badgesEarned}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-500">
                        {user.streak > 0 ? (
                          <span className="flex items-center justify-center gap-0.5">
                            <Zap size={10} className="fill-amber-500 text-amber-500" />
                            {user.streak}d
                          </span>
                        ) : '0'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); navigate(`/profile/${user.userId}`); }}
                          className="text-[10px] font-bold py-1 px-2.5 rounded-lg border border-slate-800 text-slate-350 hover:bg-slate-800 shrink-0"
                        >
                          Profile
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Anchored logged-in user ranking banner if not in top 10 */}
        {!loading && currentUserEntry && !isCurrentUserInList && (
          <div 
            onClick={() => navigate(`/profile/${currentUserEntry.userId}`)}
            className="p-4 bg-emerald-500/10 border-2 border-emerald-500/30 hover:border-emerald-500/50 cursor-pointer rounded-xl flex items-center justify-between gap-4 text-xs font-semibold animate-scale-in"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🏆</span>
              <div>
                <span className="block font-black text-white">Your Leaderboard Placement</span>
                <span className="text-[10px] text-slate-450 block mt-0.5">
                  You are currently ranked <strong className="text-emerald-400">#{currentUserEntry.rank}</strong> out of {totalElements} citizens with <strong className="text-emerald-400">{currentUserEntry.points.toLocaleString()} XP</strong>.
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              className="text-[10px] border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            >
              View My Public Stats
            </Button>
          </div>
        )}

        {/* Pagination controls */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-between items-center pt-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Page {page + 1} of {totalPages} ({totalElements} citizens)
            </span>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page === 0}
                onClick={() => setPage(prev => Math.max(0, prev - 1))}
                className="p-2 border-slate-800 text-slate-350 hover:bg-slate-850 rounded-xl"
              >
                <ChevronLeft size={14} />
              </Button>
              <Button
                variant="outline"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                className="p-2 border-slate-800 text-slate-350 hover:bg-slate-850 rounded-xl"
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* Ranking Logic Details */}
        <div className="border-t border-slate-850 pt-5 text-[10px] text-slate-500 leading-relaxed font-semibold">
          <h5 className="text-[11px] font-black uppercase text-slate-450 tracking-wider mb-1 flex items-center gap-1">
            <Award size={12} className="text-emerald-500" />
            Ranking Calculation Logic
          </h5>
          <p>
            Community reputation rankings are calculated in real time. Citizens earn points by reporting verified infrastructure issues (+10 XP), giving community feedback (+15 XP), and upvoting neighborhood issues (+5 XP). Successful resolution verification by public works dispatcher crews awards a milestone bonus of <span className="text-emerald-400">+50 XP</span>.
          </p>
        </div>
      </Card>
    </div>
  );
}
