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
import '../styles/dashboard/RiskDashboard.css';

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
  const [activeDetailsTab, setActiveDetailsTab] = useState('risk-metrics');

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
          className="p-2.5 bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors duration-200"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Top statistics widgets grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Average Risk */}
          <Card className="p-4 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 text-emerald-500 rounded-xl">
              <TrendingUp size={22} />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold block">Average Risk Index</span>
              <span className="text-2xl font-black text-foreground">{Math.round(stats.averageRiskScore || 0)}</span>
            </div>
          </Card>

          {/* Critical Threats */}
          <Card className="p-4 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/20 text-rose-500 rounded-xl">
              <AlertTriangle size={22} />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold block">Critical Threats</span>
              <span className="text-2xl font-black text-foreground">{stats.criticalThreatCount || 0}</span>
            </div>
          </Card>

          {/* High Priority (P1/P2) */}
          <Card className="p-4 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/20 text-orange-500 rounded-xl">
              <ShieldCheck size={22} />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold block">P1/P2 Actions</span>
              <span className="text-2xl font-black text-foreground">
                {((stats.priorityDistribution?.P1 || 0) + (stats.priorityDistribution?.P2 || 0))}
              </span>
            </div>
          </Card>

          {/* Total reports assessed */}
          <Card className="p-4 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 text-blue-500 rounded-xl">
              <FileText size={22} />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold block">Total Risk Scans</span>
              <span className="text-2xl font-black text-foreground">{stats.totalAssessedCount || 0}</span>
            </div>
          </Card>

        </div>
      )}

      {/* Main Split Panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: High Risk incidents list */}
        <div className="lg:col-span-5 h-[600px] flex">
          <div className="w-full bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col h-full">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 shrink-0">
              High Risk Incidents (Score ≥ 60)
            </h3>
            
            {highRiskList.length === 0 ? (
              <p className="text-muted-foreground text-xs text-center flex-1 flex items-center justify-center">No high-risk threats detected currently.</p>
            ) : (
              <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 scrollbar-thin">
                {highRiskList.map((item) => {
                  const isSelected = selectedRisk?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectRisk(item)}
                      className={`p-3.5 border rounded-xl cursor-pointer transition-all duration-200 flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-gray-100/50 dark:bg-slate-900/50 border-emerald-500/50 shadow-md'
                          : 'bg-gray-50/30 dark:bg-slate-950/20 border-border hover:border-emerald-500/30 hover:bg-gray-100/50 dark:hover:bg-slate-900/20'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${getThreatColor(item.threatLevel)}`} />
                          <h4 className="text-xs font-semibold text-foreground truncate">{item.incidentTitle}</h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                          <SeverityBadge severity={item.severity} />
                          <UrgencyBadge urgency={item.urgency} />
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{item.incidentAddress}</p>
                      </div>

                      {/* Score circle */}
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-lg font-black text-foreground">{item.overallRiskScore}</span>
                        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Index</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>        {/* Right Column: Split Detail screen */}
        <div className="lg:col-span-7 h-[600px] flex">
          {loadingDetails ? (
            <div className="w-full flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-xl bg-muted/20 h-full gap-2.5">
              <Loader2 size={24} className="animate-spin text-emerald-400" />
              <span className="text-xs text-muted-foreground">Fetching incident profiles...</span>
            </div>
          ) : selectedRisk && selectedIncident ? (
            <div className="w-full bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col h-full overflow-hidden justify-between">
              
              {/* Tab Selector */}
              <div className="flex border-b border-border gap-1 pb-px overflow-x-auto scrollbar-none shrink-0 mb-4">
                {[
                  { id: 'risk-metrics', label: 'Risk Metrics' },
                  { id: 'ai-analysis', label: 'AI Analysis' },
                  { id: 'timeline', label: 'Workflow Timeline' },
                  { id: 'action-plan', label: 'Action Plan & Diagnostics' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveDetailsTab(tab.id)}
                    className={`px-4 py-2 text-xs font-bold border-b-2 transition-all duration-200 whitespace-nowrap ${
                      activeDetailsTab === tab.id
                        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab contents */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-6 scrollbar-thin">
                {activeDetailsTab === 'risk-metrics' && (
                  /* Risk dashboard metrics */
                  <RiskCard 
                    risk={selectedRisk} 
                    onReanalyzeUpdate={handleReanalyzeUpdate} 
                  />
                )}

                {activeDetailsTab === 'ai-analysis' && (
                  /* Explainability and reasoning justification */
                  <ReasoningCard risk={selectedRisk} />
                )}

                {activeDetailsTab === 'timeline' && (
                  /* Process timeline card */
                  <TimelineCard 
                    incident={selectedIncident} 
                    analysis={selectedAnalysis} 
                    risk={selectedRisk} 
                  />
                )}

                {activeDetailsTab === 'action-plan' && (
                  <>
                    {/* Actions recommendations */}
                    <RecommendationPanel recommendations={selectedRisk.recommendations} />

                    {/* Collapsible original diagnostics card */}
                    <div className="border border-border rounded-xl overflow-hidden shadow-sm bg-card">
                      <div className="bg-gray-50/50 dark:bg-slate-950/20 p-4 border-b border-border flex justify-between items-center">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                          <FileText size={14} className="text-emerald-500 dark:text-emerald-400" />
                          Reference Diagnostics Report
                        </span>
                      </div>
                      <div className="p-4 max-h-[350px] overflow-y-auto">
                        <AnalysisCard incident={selectedIncident} analysis={selectedAnalysis} />
                      </div>
                    </div>
                  </>
                )}
              </div>

            </div>
          ) : (
            <div className="w-full flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-xl bg-muted/20 h-full text-muted-foreground text-xs">
              Select an incident from the high-risk panel to view details.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
