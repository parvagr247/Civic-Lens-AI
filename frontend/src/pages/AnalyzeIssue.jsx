import React, { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import IssueUploadForm from '../components/incident/IssueUploadForm';
import AnalysisCard from '../components/incident/AnalysisCard';
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

  const handleAnalysisSuccess = (incident, analysis) => {
    setReportedIncident(incident);
    setAnalysisReport(analysis);
    toast('AI analysis completed successfully!', 'success');
  };

  const handleReset = () => {
    setReportedIncident(null);
    setAnalysisReport(null);
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
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 rounded-xl text-xs font-semibold animate-fade-in max-w-max">
              <Sparkles size={14} className="animate-pulse" />
              <span>AI Diagnostics Generated successfully. Parent Incident Status updated to Under Review.</span>
            </div>
            <AnalysisCard incident={reportedIncident} analysis={analysisReport} />
          </div>
        ) : (
          <IssueUploadForm onAnalysisSuccess={handleAnalysisSuccess} />
        )}
      </div>

    </div>
  );
}
