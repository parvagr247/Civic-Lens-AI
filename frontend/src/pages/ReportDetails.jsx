import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getIncidentById, overrideIncident } from '../services/issueService';
import { getIncidentAnalysis } from '../services/analysisService';
import { getRiskByIncidentId } from '../services/riskService';
import { getAssignmentForIncident, assignIncident } from '../services/officerService';
import { getComments, addComment, likeComment } from '../services/collaborationService';
import { getCurrentUser } from '../services/authService';
import { getAIRecommendation, verifyIncidentResolution } from '../services/operationsService';
import { getDuplicateCheck, getIncidentPredictions, getAiTimeline } from '../services/copilotService';

import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { ErrorState } from '../components/ui/ErrorState';
import CommentsList from '../components/comments/CommentsList';

import { 
  ArrowLeft, MapPin, Calendar, User, Shield, AlertTriangle, 
  Sparkles, CheckCircle2, Clipboard, Clock, MessageSquare, 
  Paperclip, Activity, Send, Loader2, GitCommit, Settings, HelpCircle, Printer, CheckCircle, TrendingUp
} from 'lucide-react';
import { useToast } from '../components/ui/ToastProvider';

import '../styles/community/Feed.css';
import '../styles/comments/Comments.css';

/**
 * ReportDetails page component.
 * Redesigned report details organized into distinct visual cards.
 */
export default function ReportDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  // Data states
  const [incident, setIncident] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [risk, setRisk] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [comments, setComments] = useState([]);
  
  // Day 6 AI Dispatch & Verification states
  const [aiDispatchRec, setAiDispatchRec] = useState(null);
  const [loadingDispatchRec, setLoadingDispatchRec] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState('');
  const [applyingDispatch, setApplyingDispatch] = useState(false);

  // Day 7 AI Agent states
  const [predictions, setPredictions] = useState(null);
  const [duplicateCheck, setDuplicateCheck] = useState(null);
  const [aiTimeline, setAiTimeline] = useState([]);
  const [loadingAiData, setLoadingAiData] = useState(false);

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Day 7 Override Form States
  const [overrideCategory, setOverrideCategory] = useState('ROADS');
  const [overridePriority, setOverridePriority] = useState('P2');
  const [overrideStatus, setOverrideStatus] = useState('REPORTED');
  const [savingOverride, setSavingOverride] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAllDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load primary incident
      const incRes = await getIncidentById(id);
      if (!incRes.success || !incRes.data) {
        throw new Error('Incident not found.');
      }
      const incData = incRes.data;
      setIncident(incData);
      setOverrideCategory(incData.category || 'ROADS');
      setOverrideStatus(incData.status || 'REPORTED');

      // Load auxiliary details concurrently
      const [analysisRes, riskRes, assignmentRes, commentsRes] = await Promise.allSettled([
        getIncidentAnalysis(id),
        getRiskByIncidentId(id),
        getAssignmentForIncident(id),
        getComments(id)
      ]);

      if (analysisRes.status === 'fulfilled' && analysisRes.value.success) {
        setAnalysis(analysisRes.value.data);
      }
      if (riskRes.status === 'fulfilled' && riskRes.value.success) {
        setRisk(riskRes.value.data);
      }
      if (assignmentRes.status === 'fulfilled' && assignmentRes.value.success) {
        setAssignment(assignmentRes.value.data);
        if (assignmentRes.value.data) {
          setOverridePriority(assignmentRes.value.data.priority || 'P2');
        }
      }
      if (commentsRes.status === 'fulfilled' && commentsRes.value.success) {
        setComments(commentsRes.value.data || []);
      }

      // Fetch AI Dispatch recommendation if current user is an Admin
      const isAdminUser = currentUser?.role === 'ADMIN' || currentUser?.role?.toUpperCase() === 'ADMIN';
      if (isAdminUser && ['REPORTED', 'INVESTIGATING'].includes(incData.status)) {
        setLoadingDispatchRec(true);
        try {
          const recRes = await getAIRecommendation(id);
          if (recRes.success) {
            setAiDispatchRec(recRes.data);
          }
        } catch (recErr) {
          console.warn("AI recommendation retrieval failed", recErr);
        } finally {
          setLoadingDispatchRec(false);
        }
      }

      // Fetch Day 7 AI Agent metrics (predictions, duplicates, and timelines)
      setLoadingAiData(true);
      try {
        const [predRes, dupRes, timelineRes] = await Promise.allSettled([
          getIncidentPredictions(id),
          getDuplicateCheck(id),
          getAiTimeline(id)
        ]);
        if (predRes.status === 'fulfilled' && predRes.value.success) {
          setPredictions(predRes.value.data);
        }
        if (dupRes.status === 'fulfilled' && dupRes.value.success) {
          setDuplicateCheck(dupRes.value.data);
        }
        if (timelineRes.status === 'fulfilled' && timelineRes.value.success) {
          setAiTimeline(timelineRes.value.data || []);
        }
      } catch (aiErr) {
        console.warn("AI metadata retrieval failed", aiErr);
      } finally {
        setLoadingAiData(false);
      }

    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load report details.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRecommendation = async () => {
    if (!aiDispatchRec || !aiDispatchRec.recommendedOfficerId) return;
    setApplyingDispatch(true);
    try {
      // Calculate SLA deadline: current time + estimated hours * 3600000ms
      const deadline = Date.now() + (aiDispatchRec.estimatedHours || 24) * 3600000;
      const res = await assignIncident(
        id,
        aiDispatchRec.recommendedOfficerId,
        deadline,
        aiDispatchRec.priority || 'P2',
        `AI Automated Dispatch Suggestion. Reasoning: ${aiDispatchRec.reasoning}`
      );
      if (res.success) {
        toast('AI recommended routing applied successfully!', 'success');
        fetchAllDetails();
      }
    } catch (err) {
      console.error(err);
      toast('Failed to apply AI recommended dispatcher routing.', 'error');
    } finally {
      setApplyingDispatch(false);
    }
  };

  const handleVerifyResolution = async (confirm) => {
    setVerifying(true);
    try {
      const res = await verifyIncidentResolution(id, confirm, verificationFeedback || (confirm ? "Resolution confirmed." : "Rejected fix."));
      if (res.success) {
        toast(confirm ? 'Incident verified and CLOSED.' : 'Incident REOPENED for inspection.', 'success');
        setVerificationFeedback('');
        fetchAllDetails();
      }
    } catch (err) {
      console.error(err);
      toast('Failed to process resolution verification.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const handleSaveOverrides = async () => {
    setSavingOverride(true);
    try {
      const res = await overrideIncident(id, {
        category: overrideCategory,
        priority: overridePriority,
        status: overrideStatus
      });
      if (res.success) {
        toast('Manual overrides saved successfully!', 'success');
        fetchAllDetails();
      }
    } catch (err) {
      toast('Failed to apply overrides.', 'error');
    } finally {
      setSavingOverride(false);
    }
  };

  useEffect(() => {
    fetchAllDetails();
  }, [id]);

  const handlePostComment = async () => {
    if (!newCommentText.trim()) return;
    setSubmittingComment(true);
    try {
      const response = await addComment(id, newCommentText, null);
      if (response.success) {
        setComments(prev => [...prev, response.data]);
        setNewCommentText('');
        toast('Comment added successfully!', 'success');
      }
    } catch (err) {
      toast('Failed to post comment.', 'error');
    } finally {
      setSubmittingComment(false);
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

  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'P1': return 'bg-red-100 text-red-800 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60';
      case 'P2': return 'bg-orange-100 text-orange-800 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-400';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-6">
        <div className="flex items-center gap-2">
          <SkeletonLoader variant="text" count={1} className="w-1/4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <SkeletonLoader variant="card" count={3} />
          </div>
          <div className="space-y-6">
            <SkeletonLoader variant="card" count={2} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <ErrorState 
          title="Error Loading Report" 
          message={error} 
          onRetry={fetchAllDetails} 
        />
      </div>
    );
  }

  const isAnon = incident.anonymous;

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 animate-fade-in text-slate-900 dark:text-slate-100">
      
      {/* Back navigation header */}
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-850"
        >
          <ArrowLeft size={14} className="mr-1" /> Back
        </Button>
        <h2 className="text-base font-extrabold tracking-tight">Report Details</h2>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Tabbed Viewport area */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Tab Selector */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 pb-px overflow-x-auto scrollbar-none">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'ai-analysis', label: 'AI Analysis' },
              { id: 'timeline', label: 'Timeline' },
              { id: 'evidence', label: 'Evidence' },
              { id: 'comments', label: 'Comments' },
              { id: 'history', label: 'History' },
              { id: 'resolution', label: 'Resolution' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab contents */}
          <div className="space-y-6">
            
            {activeTab === 'overview' && (
              <>
                {/* Overview Card */}
                <Card className="p-6 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-855 shadow-sm space-y-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusColor(incident.status)}`}>
                      {incident.status}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ID: {incident.id?.substring(0, 8)}...
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug">{incident.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 dark:text-slate-450 text-[10px] font-semibold pt-1">
                      <span className="flex items-center gap-1">
                        <User size={12} className="text-emerald-500" />
                        {isAnon ? 'Anonymous Citizen' : incident.reportedBy}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-emerald-500" />
                        {new Date(incident.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-655 dark:text-slate-350 leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-900">
                    {incident.description}
                  </p>
                </Card>

                {/* Location Grid */}
                <Card className="p-6 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-855 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-855 pb-2">
                    Location Coordinates
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-900">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Physical Address</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 block leading-tight">
                        {incident.location?.address || 'Unavailable'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-900">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Latitude</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 block font-mono">
                        {incident.location?.latitude || 'N/A'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-900">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Longitude</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 block font-mono">
                        {incident.location?.longitude || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Simulated mini Map visualization */}
                  <div className="h-32 w-full rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-855 flex flex-col items-center justify-center text-center p-4 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
                    <MapPin size={20} className="text-emerald-500 animate-bounce relative z-10" />
                    <span className="text-[10px] text-slate-500 font-bold mt-2 relative z-10">Smart City Mapping Grid</span>
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5 relative z-10">
                      Coords: [{incident.location?.latitude || '0.0000'}, {incident.location?.longitude || '0.0000'}]
                    </span>
                  </div>
                </Card>
              </>
            )}

            {activeTab === 'ai-analysis' && (
              <>
                {/* AI Dispatch Suggestion */}
                {(currentUser?.role === 'ADMIN' || currentUser?.role?.toUpperCase() === 'ADMIN') && !assignment && ['REPORTED', 'INVESTIGATING'].includes(incident.status) && (
                  <Card className="p-6 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 dark:from-emerald-950/10 dark:to-blue-950/10 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-350 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-855 pb-2">
                      <Sparkles className="text-emerald-500" size={15} />
                      AI Dispatch Suggestion
                    </h4>
                    {loadingDispatchRec ? (
                      <SkeletonLoader variant="text" count={2} />
                    ) : aiDispatchRec ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-[10px]">
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-855">
                            <span className="text-[9px] text-slate-400 block font-bold">Best Department</span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-200 block mt-0.5">{aiDispatchRec.recommendedDepartment}</span>
                          </div>
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-855">
                            <span className="text-[9px] text-slate-400 block font-bold">Suggested Officer</span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-200 block mt-0.5">{aiDispatchRec.recommendedOfficerName || 'None matching'}</span>
                          </div>
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-855">
                            <span className="text-[9px] text-slate-400 block font-bold">Priority / SLA</span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-200 block mt-0.5">{aiDispatchRec.priority} ({aiDispatchRec.estimatedHours}h limit)</span>
                          </div>
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-855">
                            <span className="text-[9px] text-slate-400 block font-bold">Routing Confidence</span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-200 block mt-0.5">{Math.round(aiDispatchRec.confidence * 100)}%</span>
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-855">
                          <span className="text-[9px] text-slate-400 block font-bold">Routing Reasoning</span>
                          <p className="text-[10px] text-slate-650 dark:text-slate-355 leading-relaxed mt-0.5">{aiDispatchRec.reasoning}</p>
                        </div>
                        {aiDispatchRec.recommendedOfficerId && (
                          <Button
                            onClick={handleApplyRecommendation}
                            disabled={applyingDispatch}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs py-2 shadow-sm"
                          >
                            {applyingDispatch ? 'Applying Routing...' : 'Apply AI Dispatch Route'}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">AI Dispatch routing recommendations are unavailable.</p>
                    )}
                  </Card>
                )}

                {/* AI Vision Diagnostics */}
                <Card className="p-6 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-855 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-855 pb-2 flex items-center gap-1.5">
                    <Sparkles className="text-emerald-500 animate-pulse" size={14} />
                    AI Vision Diagnostics
                  </h4>

                  {analysis ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-50 border border-emerald-100 text-emerald-650 dark:bg-emerald-950/40 dark:border-emerald-900/40 dark:text-emerald-400">
                          Diagnostics Verified
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-50 border border-blue-100 text-blue-600 dark:bg-blue-950/40 dark:border-blue-900/40 dark:text-blue-400">
                          Model: Gemini-Pro-Vision
                        </span>
                      </div>

                      <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed bg-slate-50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-100 dark:border-slate-900">
                        <strong>AI Summary:</strong> {analysis.summaryReport}
                      </p>

                      <div className="grid grid-cols-2 gap-3 text-[10px]">
                        <div className="p-3 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-100 dark:border-slate-900 space-y-1">
                          <span className="text-[9px] text-slate-400 block font-bold">Diagnosed Category</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 block">{analysis.suggestedCategory}</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-955/30 rounded-xl border border-slate-100 dark:border-slate-900 space-y-1">
                          <span className="text-[9px] text-slate-400 block font-bold">AI Recommended Priority</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 block">{analysis.calculatedPriority || 'P2'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 py-4 text-center">AI Vision diagnostic report is currently pending generation.</p>
                  )}
                </Card>

                {/* Lifecycle Predictions */}
                {predictions && (
                  <Card className="p-6 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-855 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-855 pb-2 flex items-center gap-1.5">
                      <TrendingUp className="text-emerald-500" size={14} />
                      Lifecycle AI Predictions
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-[10px]">
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-955/40 rounded-xl border border-slate-150 dark:border-slate-850">
                        <span className="text-[9px] text-slate-400 block font-bold">Estimated Cost</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 block mt-0.5">${predictions.repairCost || 'N/A'}</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-955/40 rounded-xl border border-slate-150 dark:border-slate-850">
                        <span className="text-[9px] text-slate-400 block font-bold">Repair Time</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 block mt-0.5">{predictions.estimatedHours || 'N/A'} hours</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-955/40 rounded-xl border border-slate-150 dark:border-slate-850">
                        <span className="text-[9px] text-slate-400 block font-bold">Escalation Chance</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 block mt-0.5">{Math.round((predictions.escalationProbability || 0) * 100)}%</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-955/40 rounded-xl border border-slate-150 dark:border-slate-850">
                        <span className="text-[9px] text-slate-400 block font-bold">Traffic Disruption</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 block mt-0.5">{predictions.trafficImpact || 'LOW'}</span>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Duplicate Check */}
                {duplicateCheck && (
                  <Card className="p-6 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-855 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-855 pb-2 flex items-center gap-1.5">
                      <AlertTriangle className="text-emerald-500" size={14} />
                      Duplicate Detection Agent
                    </h4>
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500 font-bold">Duplicate Match Score</span>
                        <span className="font-black text-rose-500">{duplicateCheck.duplicateScore || 0}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${duplicateCheck.duplicateScore || 0}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-150 dark:border-slate-855">
                        <strong>Reasoning:</strong> {duplicateCheck.reasoning}
                      </p>
                    </div>
                  </Card>
                )}
              </>
            )}

            {activeTab === 'timeline' && (
              <>
                {/* Workflow Timeline Progress */}
                <Card className="p-6 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-855 shadow-sm space-y-4 animate-fade-in">
                  <h4 className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-855 pb-2">
                    Operational Workflow Timeline
                  </h4>
                  
                  <div className="relative pl-6 space-y-5 border-l-2 border-slate-150 dark:border-slate-850 ml-3 pt-2">
                    <div className="relative">
                      <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white dark:border-slate-955 shadow shadow-emerald-500/20" />
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Citizen Reported</div>
                      <div className="text-[9px] text-slate-500">Incident successfully submitted on {new Date(incident.createdAt).toLocaleDateString()}</div>
                    </div>

                    <div className="relative">
                      <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-4 border-white dark:border-slate-955 shadow ${
                        analysis ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-slate-200 dark:bg-slate-800'
                      }`} />
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">AI Analyzed</div>
                      <div className="text-[9px] text-slate-500">
                        {analysis ? 'Gemini tag analysis completed successfully' : 'Pending AI structural analysis'}
                      </div>
                    </div>

                    <div className="relative">
                      <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-4 border-white dark:border-slate-955 shadow ${
                        risk ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-slate-200 dark:bg-slate-800'
                      }`} />
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Risk Calculated</div>
                      <div className="text-[9px] text-slate-500">
                        {risk ? `Threat Level calculated: ${risk.threatLevel}` : 'Pending SLA priority score calculations'}
                      </div>
                    </div>

                    <div className="relative">
                      <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-4 border-white dark:border-slate-955 shadow ${
                        assignment ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-slate-200 dark:bg-slate-800'
                      }`} />
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Assigned</div>
                      <div className="text-[9px] text-slate-500">
                        {assignment ? `Dispatched to officer ${assignment.officerName}` : 'Awaiting admin dispatch routing'}
                      </div>
                    </div>

                    <div className="relative">
                      <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-4 border-white dark:border-slate-955 shadow ${
                        assignment && ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'].includes(assignment.status?.toUpperCase()) 
                          ? 'bg-emerald-500 shadow-emerald-500/20' 
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`} />
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Officer Accepted</div>
                      <div className="text-[9px] text-slate-555">
                        {assignment && ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'].includes(assignment.status?.toUpperCase()) 
                          ? 'Dispatcher routing confirmed by responder' 
                          : 'Awaiting field acceptance confirmation'}
                      </div>
                    </div>

                    <div className="relative">
                      <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-4 border-white dark:border-slate-955 shadow ${
                        assignment && ['IN_PROGRESS', 'COMPLETED', 'CLOSED'].includes(assignment.status?.toUpperCase()) 
                          ? 'bg-emerald-500 shadow-emerald-500/20' 
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`} />
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Work Started</div>
                      <div className="text-[9px] text-slate-500">
                        {assignment && ['IN_PROGRESS', 'COMPLETED', 'CLOSED'].includes(assignment.status?.toUpperCase()) 
                          ? 'Maintenance crews actively patching/resolving' 
                          : 'Pending responder arrival on location'}
                      </div>
                    </div>

                    <div className="relative">
                      <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-4 border-white dark:border-slate-955 shadow ${
                        ['RESOLVED', 'CLOSED'].includes(incident.status?.toUpperCase()) 
                          ? 'bg-emerald-500 shadow-emerald-500/20' 
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`} />
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Resolved</div>
                      <div className="text-[9px] text-slate-500">
                        {['RESOLVED', 'CLOSED'].includes(incident.status?.toUpperCase()) 
                          ? 'Field repairs successfully completed' 
                          : 'Pending repair completion uploads'}
                      </div>
                    </div>

                    <div className="relative">
                      <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-4 border-white dark:border-slate-955 shadow ${
                        incident.closedAt || incident.status === 'CLOSED'
                          ? 'bg-emerald-500 shadow-emerald-500/20' 
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`} />
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Citizen Confirmed & Closed</div>
                      <div className="text-[9px] text-slate-500">
                        {incident.closedAt 
                          ? `Citizen verified resolution. Ticket archived.` 
                          : 'Awaiting citizen closure confirmation'}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* AI Agent Execution Activity Logs */}
                {aiTimeline.length > 0 && (
                  <Card className="p-6 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-855 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-855 pb-2 flex items-center gap-1.5">
                      <Activity className="text-emerald-500" size={14} />
                      AI Agent Activity Logs
                    </h4>
                    <div className="relative pl-4 border-l border-slate-200 dark:border-slate-800 ml-1.5 space-y-4 text-[10px]">
                      {aiTimeline.map((step, index) => (
                        <div key={index} className="relative space-y-0.5">
                          <div className="absolute -left-[21px] top-0.5 bg-white dark:bg-slate-900 text-emerald-500 rounded-full p-0.5 border border-slate-200 dark:border-slate-800">
                            <GitCommit size={10} />
                          </div>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 block">{step.agent}</span>
                          <p className="text-slate-505 leading-normal">{step.action}</p>
                          <span className="text-[8px] text-slate-400 font-mono block">{new Date(step.timestamp).toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}

            {activeTab === 'resolution' && (
              <div className="space-y-6 animate-fade-in">
                {/* Citizen Resolution Verification */}
                {incident.status === 'RESOLVED' && (currentUser?.email === incident.reportedBy || currentUser?.role?.toUpperCase() === 'CITIZEN') && (
                  <Card className="p-6 bg-emerald-50/50 dark:bg-emerald-955/15 border-emerald-250 dark:border-emerald-900/50 shadow-sm space-y-4">
                    <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                      <CheckCircle size={16} />
                      Citizen Resolution Verification
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-355">
                      Municipal crews have marked this issue as resolved. Please confirm if the repairs are completed, or reject to reopen the ticket.
                    </p>
                    <input
                      type="text"
                      placeholder="Feedback comments (required for rejects)..."
                      value={verificationFeedback}
                      onChange={(e) => setVerificationFeedback(e.target.value)}
                      className="w-full bg-white dark:bg-slate-955/40 border border-slate-200 dark:border-slate-855 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500/50"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleVerifyResolution(true)}
                        disabled={verifying}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs py-2"
                      >
                        {verifying ? 'Saving...' : 'Confirm Resolution'}
                      </Button>
                      <Button
                        onClick={() => handleVerifyResolution(false)}
                        disabled={verifying}
                        className="flex-1 bg-rose-500 hover:bg-rose-455 text-slate-950 font-bold rounded-xl text-xs py-2"
                      >
                        Reject & Reopen
                      </Button>
                    </div>
                  </Card>
                )}

                <Card className="p-6 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-855 shadow-sm space-y-6">
                  <div className="border-b border-slate-100 dark:border-slate-855 pb-2 flex justify-between items-center flex-wrap gap-2">
                    <h4 className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest">
                      Resolution Verification
                    </h4>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                      ['RESOLVED', 'CLOSED'].includes(incident.status?.toUpperCase()) 
                        ? 'bg-emerald-500/10 text-emerald-505 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-550 border border-amber-500/20 animate-pulse'
                    }`}>
                      {['RESOLVED', 'CLOSED'].includes(incident.status?.toUpperCase()) ? 'Resolved Status' : 'Pending Resolution'}
                    </span>
                  </div>

                  {assignment && assignment.status === 'COMPLETED' && incident.status !== 'CLOSED' && (
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-4 animate-scale-in">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="text-emerald-505 mt-0.5" size={16} />
                        <div className="space-y-1">
                          <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">Field Resolution Awaiting Verification</span>
                          <p className="text-[10px] text-slate-505 leading-normal">
                            Officer {assignment.officerName} marked this incident resolved. Please verify if the repairs have been successfully completed.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button 
                          onClick={handleVerifyClosure}
                          loading={submittingVerify}
                          className="bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-black text-[10px] py-1 px-3 shadow"
                        >
                          Verify Resolution
                        </Button>
                      </div>
                    </div>
                  )}

                  {['RESOLVED', 'CLOSED'].includes(incident?.status?.toUpperCase()) ? (
                    <div id="print-certificate" className="p-8 bg-white dark:bg-slate-955 border-2 border-emerald-500 rounded-2xl shadow-xl space-y-6 max-w-2xl mx-auto relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                      <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="p-1 bg-emerald-500 text-slate-955 rounded-md"><CheckCircle size={14} /></span>
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">Resolution Certificate</h3>
                          </div>
                          <p className="text-[8px] text-slate-450">CivicLens Smart City Operations Registry</p>
                        </div>
                        <div className="text-right font-mono text-[8px] text-slate-455 space-y-0.5">
                          <p>CERTIFICATE ID: CL-RES-{incident.id?.substring(0, 8).toUpperCase()}</p>
                          <p>CLOSED ON: {incident.closedAt ? new Date(incident.closedAt).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1 text-center py-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-855">
                          <span className="text-[12px] font-black text-slate-800 dark:text-white leading-normal">{incident.title}</span>
                          <p className="text-[10px] text-slate-550 font-bold">Location: {incident.location?.address || 'City Center'}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                          <div className="space-y-1">
                            <span className="text-[8px] text-slate-450 block font-bold">Managing Division</span>
                            <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-355">{incident.assignedDepartment || 'Public Works Department'}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] text-slate-455 block font-bold">Lead Resolving Agent</span>
                            <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-355">{incident.resolvingOfficerName || 'Assigned Division Crews'}</span>
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-slate-150 dark:border-slate-855 space-y-1">
                          <span className="text-[8px] text-slate-450 block font-bold">Resolution Summary Report</span>
                          <p className="text-[10px] text-slate-655 dark:text-slate-350 leading-relaxed italic bg-emerald-50/20 dark:bg-emerald-955/5 p-3 rounded-lg border border-emerald-500/10">
                            "{incident.resolutionReport || 'The maintenance crews successfully completed repair works on site. Road structures have been patched and aligned to safety standards.'}"
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-6 border-t border-slate-200 dark:border-slate-800 text-[9px] text-slate-455 font-semibold font-mono">
                        <div className="flex items-center gap-1">
                          <CheckCircle size={10} className="text-emerald-500" />
                          <span>Citizen Verified via OTP Signature</span>
                        </div>
                        <span className="text-slate-455 font-bold">Secured by Firebase & Gemini AI Trust Index</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-500 text-xs font-semibold">
                      Resolution completion certificate will be generated automatically once the ticket is verified and resolved.
                    </div>
                  )}
                </Card>
              </div>
            )}

            {activeTab === 'history' && (
              <Card className="p-6 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-855 shadow-sm space-y-4 animate-fade-in">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest border-b border-slate-100 dark:border-slate-855 pb-2">
                  Parameters Override Logs
                </h4>

                {auditLogs.length === 0 ? (
                  <p className="text-slate-500 text-xs py-4 text-center font-semibold">No modifications logged in audit trail.</p>
                ) : (
                  <div className="space-y-3">
                    {auditLogs.map((step) => (
                      <div key={step.id} className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-slate-200 dark:border-slate-855 flex items-start justify-between gap-3 text-[10px]">
                        <div className="space-y-1">
                          <span className="block font-bold text-slate-700 dark:text-slate-350">{step.actorName} ({step.actorRole})</span>
                          <p className="text-slate-650 dark:text-slate-400 leading-normal">{step.actionDescription}</p>
                        </div>
                        <span className="text-[8px] text-slate-500 font-mono block">
                          {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {activeTab === 'comments' && (
              <Card className="p-6 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-855 shadow-sm space-y-5 animate-fade-in">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-855 pb-2 flex items-center gap-1.5">
                  <MessageSquare className="text-emerald-500" size={15} />
                  Community Discussion Board ({comments.length})
                </h4>

                {/* Submit Comment Input form */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Write a public comment..."
                    className="flex-1 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-855 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500/50"
                  />
                  <Button
                    onClick={handlePostComment}
                    disabled={submittingComment || !newCommentText.trim()}
                    className="p-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl"
                  >
                    {submittingComment ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                  </Button>
                </div>

                {/* Comments recursive list */}
                <CommentsList 
                  comments={comments} 
                  incidentId={id}
                  onCommentAdded={(newComment) => {
                    setComments(prev => [...prev, newComment]);
                  }}
                  onCommentLiked={async (commentId) => {
                    await likeComment(commentId);
                    setComments(prev => prev.map(c => {
                      if (c.id === commentId) {
                        const liked = c.likedBy || [];
                        const hasLiked = liked.includes(currentUser?.userId);
                        const newLiked = hasLiked 
                          ? liked.filter(uid => uid !== currentUser?.userId)
                          : [...liked, currentUser?.userId];
                        return { ...c, likedBy: newLiked, likesCount: newLiked.length };
                      }
                      return c;
                    }));
                  }}
                />
              </Card>
            )}

          </div>
        </div>

        {/* Right Column: Metadata Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Metadata Sidebar Card */}
          <Card className="p-5 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-slate-850 dark:text-slate-350 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
              Incident Metadata
            </h4>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 block font-bold">Report Status</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider ${getStatusColor(incident.status)}`}>
                  {incident.status}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 block font-bold">Priority Code</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${
                  incident.priority === 'P1' ? 'bg-rose-50 text-rose-600 border-rose-250 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60' : 'bg-slate-50 text-slate-650 border-slate-200 dark:bg-slate-950/40 dark:text-slate-400 dark:border-slate-855'
                }`}>
                  {incident.priority || 'P2'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 block font-bold">Department</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{incident.assignedDepartment || 'Awaiting routing'}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 block font-bold">Lead Responder</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{incident.resolvingOfficerName || 'Unassigned'}</span>
              </div>

              {assignment?.deadline && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 block font-bold">SLA Target Limit</span>
                  <span className={`font-mono font-bold ${
                    Date.now() > assignment.deadline && incident.status !== 'RESOLVED' && incident.status !== 'CLOSED'
                      ? 'text-rose-500 animate-pulse'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}>
                    {new Date(assignment.deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                onClick={() => window.print()}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs py-2 shadow-sm flex items-center justify-center gap-1"
              >
                <Printer size={13} />
                Download PDF Certificate
              </Button>
            </div>
          </Card>

          {/* Admin Override controls (if user is Admin) */}
          {(currentUser?.role === 'ADMIN' || currentUser?.role?.toUpperCase() === 'ADMIN') && (
            <Card className="p-5 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-xs font-black text-slate-855 dark:text-slate-355 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                Operational Overrides
              </h4>
              
              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Set Manual Category</label>
                  <select
                    value={overrideCategory}
                    onChange={(e) => setOverrideCategory(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-1.5 px-2.5 rounded-lg text-xs focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="ROADS">Roads & Streets</option>
                    <option value="SANITATION">Sanitation & Garbage</option>
                    <option value="WATER">Water Leakage & Mains</option>
                    <option value="ELECTRICAL">Power & Streetlights</option>
                    <option value="PARKS">Parks & Pathways</option>
                    <option value="TRAFFIC">Traffic Signals & Signage</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Set Manual Priority</label>
                  <select
                    value={overridePriority}
                    onChange={(e) => setOverridePriority(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-1.5 px-2.5 rounded-lg text-xs focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="P1">Priority P1 (Immediate 24h)</option>
                    <option value="P2">Priority P2 (Standard 3d)</option>
                    <option value="P3">Priority P3 (Routine 7d)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Modify Incident Status</label>
                  <select
                    value={overrideStatus}
                    onChange={(e) => setOverrideStatus(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-1.5 px-2.5 rounded-lg text-xs focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="REPORTED">Reported</option>
                    <option value="INVESTIGATING">Investigating</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed & Archived</option>
                  </select>
                </div>

                <Button
                  onClick={handleSaveOverrides}
                  disabled={savingOverride}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs py-2 shadow"
                >
                  {savingOverride ? 'Applying...' : 'Apply Parameter Overrides'}
                </Button>
              </div>
            </Card>
          )}
        </div>

      </div>

      {/* Print-optimized resolution certificate (hidden on screen, visible during printing) */}
      <div id="print-certificate" className="hidden print:block p-8 space-y-6 text-slate-900 bg-white min-h-screen">
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider text-slate-800">CivicLens Municipal Resolution Report</h1>
            <span className="text-xs text-slate-550 font-mono">Document reference: CERT-{id.substring(0,8).toUpperCase()}</span>
          </div>
          <div className="w-12 h-12 border border-slate-200 flex items-center justify-center font-bold text-xs">
            MUNICIPAL SEAL
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <strong>Complaint ID:</strong> {id}<br/>
            <strong>Tracking ID:</strong> {incident?.trackingId || 'N/A'}<br/>
            <strong>Category:</strong> {incident?.category}<br/>
            <strong>Reported On:</strong> {incident ? new Date(incident.createdAt).toLocaleDateString() : 'N/A'}<br/>
          </div>
          <div>
            <strong>Department:</strong> {assignment?.department || 'Public Works'}<br/>
            <strong>Assigned Officer:</strong> {assignment?.officerName || 'N/A'}<br/>
            <strong>Completion Date:</strong> {assignment?.completedAt ? new Date(assignment.completedAt).toLocaleDateString() : new Date().toLocaleDateString()}<br/>
          </div>
        </div>

        <div className="border p-4 rounded-xl space-y-2 text-xs">
          <h3 className="text-xs font-black uppercase">Resolution Details</h3>
          <p className="leading-relaxed text-slate-700">{assignment?.completionReport || 'Standard maintenance successfully executed and verified.'}</p>
        </div>

        <div className="grid grid-cols-2 gap-6 pt-12 text-center text-[10px] text-slate-400">
          <div className="border-t pt-2">
            MUNICIPAL CLERK SIGNATURE
          </div>
          <div className="border-t pt-2">
            DIGITAL VERIFICATION STAMP
          </div>
        </div>
      </div>

    </div>
  );
}
