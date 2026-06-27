import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { getRiskStatistics, getHighRiskIncidents } from '../services/riskService';
import { getIncidentById } from '../services/issueService';
import { getIncidentAnalysis } from '../services/analysisService';
import RiskCard from '../components/incident/RiskCard';
import ReasoningCard from '../components/incident/ReasoningCard';
import RecommendationPanel from '../components/incident/RecommendationPanel';
import TimelineCard from '../components/incident/TimelineCard';
import AnalysisCard from '../components/incident/AnalysisCard';
import SeverityBadge from '../components/incident/SeverityBadge';
import UrgencyBadge from '../components/incident/UrgencyBadge';
import { Loader2, TrendingUp, AlertTriangle, ShieldCheck, FileText, ArrowRight, RefreshCw } from 'lucide-react';
import { useToast } from '../components/ui/ToastProvider';

/**
 * RiskDashboard page.
 * Renders aggregated risk stats, high-risk lists, and split-screen detail views.
 */
export default function RiskDashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState(null);
  const [highRiskList, setHighRiskList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail panel states
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, listRes] = await Promise.all([
        getRiskStatistics(),
        getHighRiskIncidents(),
      ]);
      setStats(statsRes.data);
      setHighRiskList(listRes.data);

      // Auto-select first item if list is not empty
      if (listRes.data && listRes.data.length > 0) {
        handleSelectRisk(listRes.data[0]);
      } else {
        setSelectedRisk(null);
        setSelectedIncident(null);
        setSelectedAnalysis(null);
      }
    } catch (error) {
      console.error('Failed to load risk dashboard data', error);
      toast('Failed to load risk intelligence metrics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSelectRisk = async (riskItem) => {
    setSelectedRisk(riskItem);
    setLoadingDetails(true);
    try {
      const [incRes, anaRes] = await Promise.all([
        getIncidentById(riskItem.incidentId),
        getIncidentAnalysis(riskItem.incidentId),
      ]);
      setSelectedIncident(incRes.data);
      setSelectedAnalysis(anaRes.data);
    } catch (error) {
      console.error('Failed to load detail records', error);
      toast('Failed to load details for this incident.', 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleReanalyzeUpdate = (updatedRisk) => {
    // Update local lists
    setHighRiskList(prev => prev.map(item => item.id === updatedRisk.id ? updatedRisk : item));
    setSelectedRisk(updatedRisk);
    // Refresh statistics
    getRiskStatistics().then(res => setStats(res.data));
    toast('Risk re-evaluation complete!', 'success');
  };

  const getThreatColor = (level) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL': return 'bg-rose-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-amber-500';
      default: return 'bg-emerald-500';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 size={32} className="animate-spin text-emerald-400" />
        <span className="text-sm text-slate-400">Loading Municipal Risk Intelligence...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <PageHeader
          title="Municipal Risk Intelligence"
          subtitle="Smart city decision support displaying threat estimations, prioritize dispatch orders, and SLAs."
        />
        <button
          type="button"
          onClick={fetchDashboardData}
          className="p-2.5 bg-slate-900 border border-slate-800 text-slate-350 hover:text-white rounded-lg transition-colors duration-200"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Top statistics widgets grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Average Risk */}
          <Card className="p-4 bg-slate-900/30 border-slate-800 flex items-center gap-4">
            <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 rounded-xl">
              <TrendingUp size={22} />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">Average Risk Index</span>
              <span className="text-2xl font-black text-white">{Math.round(stats.averageRiskScore || 0)}</span>
            </div>
          </Card>

          {/* Critical Threats */}
          <Card className="p-4 bg-slate-900/30 border-slate-800 flex items-center gap-4">
            <div className="p-3 bg-rose-950/40 border border-rose-900/60 text-rose-400 rounded-xl">
              <AlertTriangle size={22} />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">Critical Threats</span>
              <span className="text-2xl font-black text-white">{stats.criticalThreatCount || 0}</span>
            </div>
          </Card>

          {/* High Priority (P1/P2) */}
          <Card className="p-4 bg-slate-900/30 border-slate-800 flex items-center gap-4">
            <div className="p-3 bg-orange-950/40 border border-orange-900/60 text-orange-400 rounded-xl">
              <ShieldCheck size={22} />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">P1/P2 Actions</span>
              <span className="text-2xl font-black text-white">
                {((stats.priorityDistribution?.P1 || 0) + (stats.priorityDistribution?.P2 || 0))}
              </span>
            </div>
          </Card>

          {/* Total reports assessed */}
          <Card className="p-4 bg-slate-900/30 border-slate-800 flex items-center gap-4">
            <div className="p-3 bg-blue-950/40 border border-blue-900/60 text-blue-400 rounded-xl">
              <FileText size={22} />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">Total Risk Scans</span>
              <span className="text-2xl font-black text-white">{stats.totalAssessedCount || 0}</span>
            </div>
          </Card>

        </div>
      )}

      {/* Main Split Panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: High Risk incidents list */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-4 shadow-md">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              High Risk Incidents (Score ≥ 60)
            </h3>
            
            {highRiskList.length === 0 ? (
              <p className="text-slate-500 text-xs py-6 text-center">No high-risk threats detected currently.</p>
            ) : (
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {highRiskList.map((item) => {
                  const isSelected = selectedRisk?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectRisk(item)}
                      className={`p-3.5 border rounded-xl cursor-pointer transition-all duration-200 flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-slate-850/60 border-emerald-500/50 shadow-md'
                          : 'bg-slate-950/20 border-slate-850 hover:border-slate-700 hover:bg-slate-900/30'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${getThreatColor(item.threatLevel)}`} />
                          <h4 className="text-xs font-semibold text-slate-200 truncate">{item.incidentTitle}</h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                          <SeverityBadge severity={item.severity} />
                          <UrgencyBadge urgency={item.urgency} />
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{item.incidentAddress}</p>
                      </div>

                      {/* Score circle */}
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-lg font-black text-white">{item.overallRiskScore}</span>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Index</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Split Detail screen */}
        <div className="lg:col-span-7">
          {loadingDetails ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/10 min-h-[400px] gap-2.5">
              <Loader2 size={24} className="animate-spin text-emerald-400" />
              <span className="text-xs text-slate-400">Fetching incident profiles...</span>
            </div>
          ) : selectedRisk && selectedIncident ? (
            <div className="space-y-6">
              
              {/* Process timeline card */}
              <TimelineCard 
                incident={selectedIncident} 
                analysis={selectedAnalysis} 
                risk={selectedRisk} 
              />

              {/* Risk dashboard metrics */}
              <RiskCard 
                risk={selectedRisk} 
                onReanalyzeUpdate={handleReanalyzeUpdate} 
              />

              {/* Explainability and reasoning justification */}
              <ReasoningCard risk={selectedRisk} />

              {/* Actions recommendations */}
              <RecommendationPanel recommendations={selectedRisk.recommendations} />

              {/* Collapsible original diagnostics card */}
              <div className="border border-slate-800 rounded-xl overflow-hidden shadow-lg bg-slate-900/10">
                <div className="bg-slate-900/50 p-4 border-b border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-350 uppercase tracking-widest flex items-center gap-2">
                    <FileText size={14} className="text-emerald-400" />
                    Reference Diagnostics Report
                  </span>
                </div>
                <div className="p-4 max-h-[450px] overflow-y-auto">
                  <AnalysisCard incident={selectedIncident} analysis={selectedAnalysis} />
                </div>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/10 min-h-[400px] text-slate-500 text-xs">
              Select an incident from the high-risk panel to view details.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
