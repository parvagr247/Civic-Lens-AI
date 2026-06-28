import React, { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import IssueUploadForm from '../components/incident/IssueUploadForm';
import AnalysisCard from '../components/incident/AnalysisCard';
import RiskCard from '../components/incident/RiskCard';
import TimelineCard from '../components/incident/TimelineCard';
import ReasoningCard from '../components/incident/ReasoningCard';
import RecommendationPanel from '../components/incident/RecommendationPanel';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useToast } from '../components/ui/ToastProvider';

/**
 * Page view page coordinating the upload form and AI report outcomes.
 */
export default function AnalyzeIssue() {
  const { toast } = useToast();
  
  // Completed result states
  const [reportedIncident, setReportedIncident] = useState(null);
  const [analysisReport, setAnalysisReport] = useState(null);
  const [riskReport, setRiskReport] = useState(null);

  const [activeResultTab, setActiveResultTab] = useState('diagnostics');

  const handleAnalysisSuccess = (incident, analysis, risk) => {
    setReportedIncident(incident);
    setAnalysisReport(analysis);
    setRiskReport(risk);
    toast('AI analysis and Risk assessment completed!', 'success');
  };

  const handleReset = () => {
    setReportedIncident(null);
    setAnalysisReport(null);
    setRiskReport(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader 
          title="Analyze Civic Incident" 
          subtitle="Upload images of civic infrastructure problems to trigger automatic Gemini Vision AI diagnostics."
        />
        {reportedIncident && (
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="flex items-center gap-1.5 self-start sm:self-auto"
          >
            <ArrowLeft size={14} />
            Report Another Issue
          </Button>
        )}
      </div>

      {/* Main Container */}
      <div className="w-full">
        {reportedIncident && analysisReport ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2 p-3 bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 rounded-xl text-xs font-semibold animate-fade-in max-w-max">
                <Sparkles size={14} className="animate-pulse" />
                <span>AI Diagnostics and Risk Assessment generated successfully. Status: Under Review.</span>
              </div>
            </div>

            {/* Tab Selector */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 pb-px overflow-x-auto scrollbar-none">
              {[
                { id: 'diagnostics', label: 'AI Vision Diagnostics' },
                { id: 'risk', label: 'Risk & Urgency' },
                { id: 'timeline', label: 'Dispatch Timeline' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveResultTab(tab.id)}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all duration-200 whitespace-nowrap ${
                    activeResultTab === tab.id
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="space-y-6 animate-fade-in">
              {activeResultTab === 'diagnostics' && (
                /* AI Vision Analysis details card */
                <AnalysisCard 
                  incident={reportedIncident} 
                  analysis={analysisReport} 
                />
              )}

              {activeResultTab === 'risk' && riskReport && (
                /* Risk details grid */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-5">
                    <RiskCard 
                      risk={riskReport} 
                      onReanalyzeUpdate={setRiskReport} 
                    />
                  </div>
                  <div className="lg:col-span-7 space-y-6">
                    <ReasoningCard risk={riskReport} />
                    <RecommendationPanel recommendations={riskReport.recommendations} />
                  </div>
                </div>
              )}

              {activeResultTab === 'timeline' && (
                /* horizontal progress timeline */
                <TimelineCard 
                  incident={reportedIncident} 
                  analysis={analysisReport} 
                  risk={riskReport} 
                />
              )}
            </div>

          </div>
        ) : (
          <IssueUploadForm onAnalysisSuccess={handleAnalysisSuccess} />
        )}
      </div>

    </div>
  );
}
