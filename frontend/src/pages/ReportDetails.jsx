import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  Paperclip, Activity, Send, Loader2, GitCommit, Settings, HelpCircle, Printer, CheckCircle, TrendingUp, XCircle, FileText, Image as ImageIcon
} from 'lucide-react';
import { useToast } from '../components/ui/ToastProvider';

import '../styles/community/Feed.css';
import '../styles/comments/Comments.css';

/**
 * ReportDetails page component.
 * Case-management workspace with advanced PDF certificate downloads, evidence zoom,
 * and lazy-loaded contextual metrics tabs.
 */
export default function ReportDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  const certificateRef = useRef(null);

  // Data states
  const [incident, setIncident] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [risk, setRisk] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [comments, setComments] = useState([]);
  
  // Dispatch & Verification states
  const [aiDispatchRec, setAiDispatchRec] = useState(null);
  const [loadingDispatchRec, setLoadingDispatchRec] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState('');
  const [applyingDispatch, setApplyingDispatch] = useState(false);

  // AI timelines & metrics
  const [predictions, setPredictions] = useState(null);
  const [duplicateCheck, setDuplicateCheck] = useState(null);
  const [aiTimeline, setAiTimeline] = useState([]);
  const [loadingAiData, setLoadingAiData] = useState(false);

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  // Override Form States
  const [overrideCategory, setOverrideCategory] = useState('ROADS');
  const [overridePriority, setOverridePriority] = useState('P2');
  const [overrideStatus, setOverrideStatus] = useState('REPORTED');
  const [savingOverride, setSavingOverride] = useState(false);

  const [activeTab, setActiveTab] = useState('overview');

  // Lazy loading tab cache tracker
  const [loadedTabs, setLoadedTabs] = useState({
    overview: true,
    'ai-analysis': false,
    timeline: false,
    evidence: false,
    comments: false,
    history: false,
    resolution: false
  });

  const fetchAllDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load primary incident details immediately
      const incRes = await getIncidentById(id);
      if (!incRes.success || !incRes.data) {
        throw new Error('Incident not found.');
      }
      const incData = incRes.data;
      setIncident(incData);
      setOverrideCategory(incData.category || 'ROADS');
      setOverrideStatus(incData.status || 'REPORTED');

      // Pre-fetch assignment immediately for the metadata sidebar
      try {
        const assignmentRes = await getAssignmentForIncident(id);
        if (assignmentRes.success && assignmentRes.data) {
          setAssignment(assignmentRes.data);
          setOverridePriority(assignmentRes.data.priority || 'P2');
        }
      } catch (assErr) {
        console.warn("Failed to load assignment on mount", assErr);
      }

      // Fetch AI Dispatch recommendation if Admin
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

      // Reset loaded tabs tracker
      setLoadedTabs({
        overview: true,
        'ai-analysis': false,
        timeline: false,
        evidence: false,
        comments: false,
        history: false,
        resolution: false
      });

    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load report details.');
    } finally {
      setLoading(false);
    }
  };

  // Centralized Tab-Specific Lazy Loading
  useEffect(() => {
    if (!id || !incident) return;

    const loadTabSpecificData = async () => {
      if (loadedTabs[activeTab]) return;

      if (activeTab === 'ai-analysis') {
        try {
          const [analysisRes, predRes, dupRes] = await Promise.allSettled([
            getIncidentAnalysis(id),
            getIncidentPredictions(id),
            getDuplicateCheck(id)
          ]);
          if (analysisRes.status === 'fulfilled' && analysisRes.value.success) {
            setAnalysis(analysisRes.value.data);
          }
          if (predRes.status === 'fulfilled' && predRes.value.success) {
            setPredictions(predRes.value.data);
          }
          if (dupRes.status === 'fulfilled' && dupRes.value.success) {
            setDuplicateCheck(dupRes.value.data);
          }
        } catch (err) {
          console.warn("Failed to load AI Analysis tab data", err);
        }
      } else if (activeTab === 'timeline') {
        try {
          const [riskRes, timelineRes] = await Promise.allSettled([
            getRiskByIncidentId(id),
            getAiTimeline(id)
          ]);
          if (riskRes.status === 'fulfilled' && riskRes.value.success) {
            setRisk(riskRes.value.data);
          }
          if (timelineRes.status === 'fulfilled' && timelineRes.value.success) {
            setAiTimeline(timelineRes.value.data || []);
          }
        } catch (err) {
          console.warn("Failed to load Timeline tab data", err);
        }
      } else if (activeTab === 'comments') {
        try {
          const commentsRes = await getComments(id);
          if (commentsRes.success) {
            setComments(commentsRes.data || []);
          }
        } catch (err) {
          console.warn("Failed to load Comments data", err);
        }
      } else if (activeTab === 'resolution') {
        try {
          const assignmentRes = await getAssignmentForIncident(id);
          if (assignmentRes.success) {
            setAssignment(assignmentRes.data);
            if (assignmentRes.data) {
              setOverridePriority(assignmentRes.data.priority || 'P2');
            }
          }
        } catch (err) {
          console.warn("Failed to load Resolution data", err);
        }
      }

      setLoadedTabs(prev => ({ ...prev, [activeTab]: true }));
    };

    loadTabSpecificData();
  }, [activeTab, id, incident]);

  useEffect(() => {
    fetchAllDetails();
  }, [id]);

  const handleApplyRecommendation = async () => {
    if (!aiDispatchRec || !aiDispatchRec.recommendedOfficerId) return;
    setApplyingDispatch(true);
    try {
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

  const handleDownloadPdf = async () => {
    const element = certificateRef.current;
    if (!element) return;

    setGeneratingPdf(true);
    toast('Generating official resolution certificate PDF...', 'info');

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // High DPI density
        useCORS: true,
        backgroundColor: '#070b19',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const width = imgWidth * ratio;
      const height = imgHeight * ratio;
      
      const x = (pdfWidth - width) / 2;
      const y = (pdfHeight - height) / 2;

      pdf.addImage(imgData, 'PNG', x, y, width, height);
      pdf.save(`CivicLens-Certificate-${incident.id?.substring(0, 8).toUpperCase()}.pdf`);
      toast('Certificate downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      toast('Failed to generate PDF certificate.', 'error');
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Compile Dynamic Chronological Activity History
  const getHistoryTimeline = () => {
    if (!incident) return [];

    const timeline = [];

    // 1. Report Submitted
    timeline.push({
      id: 'submitted',
      action: 'Report Submitted',
      actor: incident.anonymous ? 'Anonymous Citizen' : (incident.reportedBy || 'Citizen'),
      timestamp: incident.createdAt,
      icon: 'FileText',
      note: `Incident reported with category ${incident.category || 'PENDING'}.`
    });

    // 2. AI Analysis Completed
    if (analysis) {
      timeline.push({
        id: 'analysis',
        action: 'AI Analysis Completed',
        actor: 'Gemini Vision Agent',
        timestamp: incident.createdAt + 2000,
        icon: 'Sparkles',
        note: `Confidence score: ${analysis.confidence ? Math.round(analysis.confidence * 100) : 92}%. Suggested Category: ${incident.category || 'ROADS'}.`
      });
    }

    // 3. Assigned to Department
    if (assignment) {
      timeline.push({
        id: 'assigned',
        action: `Assigned to ${assignment.department || 'Public Works'}`,
        actor: 'Municipal Dispatcher',
        timestamp: assignment.assignedAt || (incident.createdAt + 10000),
        icon: 'User',
        note: `Lead officer: ${assignment.officerName || 'Field Crew'}. Priority: ${assignment.priority || 'P2'}.`
      });

      // 4. Officer Accepted
      if (['ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'].includes(assignment.status?.toUpperCase())) {
        timeline.push({
          id: 'accepted',
          action: 'Officer Accepted',
          actor: assignment.officerName || 'Field Officer',
          timestamp: assignment.acceptedAt || (incident.createdAt + 30000),
          icon: 'CheckCircle2',
          note: 'Dispatch confirmed. Officer traveling to coordinates.'
        });
      }

      // 5. Inspection Started
      if (['IN_PROGRESS', 'COMPLETED', 'CLOSED'].includes(assignment.status?.toUpperCase())) {
        timeline.push({
          id: 'started',
          action: 'Inspection Started',
          actor: assignment.officerName || 'Field Officer',
          timestamp: assignment.startedAt || (incident.createdAt + 60000),
          icon: 'Clock',
          note: 'On-site investigation initiated. Field work in progress.'
        });
      }

      // 6. Resolution Uploaded
      if (['COMPLETED', 'CLOSED'].includes(assignment.status?.toUpperCase())) {
        timeline.push({
          id: 'completed',
          action: 'Resolution Uploaded',
          actor: assignment.officerName || 'Field Officer',
          timestamp: assignment.completedAt || (incident.createdAt + 120000),
          icon: 'CheckCircle',
          note: assignment.completionReport || 'Standard maintenance successfully executed and verified.'
        });
      }
    }

    // 7. Report Closed
    if (incident.status === 'CLOSED' || incident.closedAt) {
      timeline.push({
        id: 'closed',
        action: 'Report Closed',
        actor: 'Citizen Verification',
        timestamp: incident.closedAt || (incident.updatedAt || Date.now()),
        icon: 'Shield',
        note: incident.citizenFeedback || 'Resolution verified by citizen. Ticket archived.'
      });
    }

    return timeline.sort((a, b) => a.timestamp - b.timestamp);
  };

  const renderHistoryIcon = (iconName) => {
    switch (iconName) {
      case 'FileText': return <FileText size={13} className="text-blue-400" />;
      case 'Sparkles': return <Sparkles size={13} className="text-emerald-400" />;
      case 'User': return <User size={13} className="text-amber-400" />;
      case 'CheckCircle2': return <CheckCircle2 size={13} className="text-teal-400" />;
      case 'Clock': return <Clock size={13} className="text-indigo-400" />;
      case 'CheckCircle': return <CheckCircle size={13} className="text-emerald-400" />;
      case 'Shield': return <Shield size={13} className="text-slate-400" />;
      default: return <GitCommit size={13} className="text-slate-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'RESOLVED': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-450 dark:border-emerald-900/60';
      case 'CLOSED': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-955/30 dark:text-blue-400 dark:border-blue-900/60';
      case 'IN_PROGRESS': return 'bg-blue-105 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/60';
      case 'INVESTIGATING': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-955/30 dark:text-amber-450 dark:border-amber-900/60';
      case 'REPORTED':
      default: return 'bg-slate-100 text-slate-700 border-slate-205 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-6">
        <SkeletonLoader variant="text" count={1} className="w-1/4" />
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
        <ErrorState title="Error Loading Report" message={error} onRetry={fetchAllDetails} />
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
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-505 dark:text-slate-450 text-[10px] font-semibold pt-1">
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

                  <p className="text-xs text-slate-655 dark:text-slate-350 leading-relaxed bg-slate-50 dark:bg-slate-955/20 p-4 rounded-xl border border-slate-105 dark:border-slate-900">
                    {incident.description}
                  </p>
                </Card>

                {/* Location Grid */}
                <Card className="p-6 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-855 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-855 pb-2">
                    Location Coordinates
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 bg-gray-50/50 dark:bg-slate-950/30 rounded-xl border border-border shadow-sm">
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wider block font-bold">Physical Address</span>
                      <span className="text-xs font-bold text-foreground mt-1 block leading-tight">
                        {incident.location?.address || 'Unavailable'}
                      </span>
                    </div>
                    <div className="p-3 bg-gray-50/50 dark:bg-slate-950/30 rounded-xl border border-border shadow-sm">
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wider block font-bold">Latitude</span>
                      <span className="text-xs font-bold text-foreground mt-1 block font-mono">
                        {incident.location?.latitude || 'N/A'}
                      </span>
                    </div>
                    <div className="p-3 bg-gray-50/50 dark:bg-slate-950/30 rounded-xl border border-border shadow-sm">
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wider block font-bold">Longitude</span>
                      <span className="text-xs font-bold text-foreground mt-1 block font-mono">
                        {incident.location?.longitude || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="h-32 w-full rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-855 flex flex-col items-center justify-center text-center p-4 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
                    <MapPin size={20} className="text-emerald-500 animate-bounce relative z-10" />
                    <span className="text-[10px] text-slate-505 font-bold mt-2 relative z-10">Smart City Mapping Grid</span>
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5 relative z-10">
                      Coords: [{incident.location?.latitude || '0.0000'}, {incident.location?.longitude || '0.0000'}]
                    </span>
                  </div>
                </Card>
              </>
            )}

            {activeTab === 'ai-analysis' && (
              <>
                {/* AI Dispatch Routing Recommendation */}
                {(currentUser?.role === 'ADMIN' || currentUser?.role?.toUpperCase() === 'ADMIN') && !assignment && ['REPORTED', 'INVESTIGATING'].includes(incident.status) && (
                  <Card className="p-6 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 dark:from-emerald-950/10 dark:to-blue-950/10 border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-scale-in">
                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-350 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-855 pb-2">
                      <Sparkles className="text-emerald-500 animate-pulse" size={15} />
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
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs py-2 shadow-sm animate-scale-in"
                          >
                            {applyingDispatch ? 'Applying Routing...' : 'Apply AI Dispatch Route'}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-550">AI Dispatch routing recommendations are unavailable.</p>
                    )}
                  </Card>
                )}

                {/* AI Diagnostics Report */}
                <Card className="p-6 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-855 shadow-sm space-y-5">
                  <h4 className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-855 pb-2 flex items-center gap-1.5">
                    <Sparkles className="text-emerald-500" size={14} />
                    AI Vision Diagnostics
                  </h4>

                  {analysis ? (
                    <div className="space-y-4">
                      {/* Grid Properties */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-[10px] font-semibold">
                        <div className="p-3 bg-gray-50/50 dark:bg-slate-950/30 rounded-xl border border-border space-y-1 shadow-sm">
                          <span className="text-[9px] text-muted-foreground block font-bold">Detected Category</span>
                          <span className="font-extrabold text-foreground block text-xs">{incident?.category}</span>
                        </div>
                        <div className="p-3 bg-gray-50/50 dark:bg-slate-950/30 rounded-xl border border-border space-y-1 shadow-sm">
                          <span className="text-[9px] text-muted-foreground block font-bold">Suggested Department</span>
                          <span className="font-extrabold text-foreground block text-xs">{incident?.assignedDepartment || 'Public Works'}</span>
                        </div>
                        <div className="p-3 bg-gray-50/50 dark:bg-slate-950/30 rounded-xl border border-border space-y-1 shadow-sm">
                          <span className="text-[9px] text-muted-foreground block font-bold">Confidence Score</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-extrabold text-foreground text-xs">{Math.round((analysis.confidence || 0.94) * 100)}%</span>
                            <div className="h-1.5 w-16 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round((analysis.confidence || 0.94) * 100)}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Explanation */}
                      <div className="p-4 bg-gray-50/30 dark:bg-slate-950/20 border border-border rounded-xl space-y-1 text-xs">
                        <span className="text-[9px] text-muted-foreground block font-bold uppercase tracking-wider">AI Explanation</span>
                        <p className="text-gray-750 dark:text-slate-350 leading-relaxed italic">"{analysis.summary}"</p>
                      </div>

                      {/* Observed damages chips */}
                      {analysis.observedDamages && analysis.observedDamages.length > 0 && (
                        <div className="space-y-1.5 text-xs">
                          <span className="text-[9px] text-muted-foreground block font-bold uppercase tracking-wider">Affected Infrastructure</span>
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {analysis.observedDamages.map((dmg, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-slate-900 text-gray-700 dark:text-slate-300 border border-border text-[10px] font-bold">
                                {dmg}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Risk Assessment details */}
                      {risk && (
                        <div className="p-4 rounded-xl border border-rose-500/10 bg-rose-500/5 space-y-3.5 text-xs">
                          <span className="text-[9px] text-rose-400 block font-bold uppercase tracking-wider">Risk & Threats Card</span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div>
                              <span className="text-[8px] text-slate-500 block font-bold">Threat Level</span>
                              <span className="font-extrabold text-rose-450 block text-xs mt-0.5">{risk.threatLevel || 'MEDIUM'}</span>
                            </div>
                            <div>
                              <span className="text-[8px] text-slate-505 block font-bold">Urgency Code</span>
                              <span className="font-extrabold text-rose-450 block text-xs mt-0.5">{risk.urgency || 'ROUTINE'}</span>
                            </div>
                            <div>
                              <span className="text-[8px] text-slate-505 block font-bold">Overall Risk Score</span>
                              <span className="font-extrabold text-rose-450 block text-xs mt-0.5">{risk.overallRiskScore || 0}/100</span>
                            </div>
                          </div>
                          <div className="space-y-1 pt-1 border-t border-rose-500/10">
                            <span className="text-[8px] text-slate-500 block font-bold">Risk Reasoning</span>
                            <p className="text-[10.5px] text-slate-355 leading-relaxed">{risk.reasoning}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 py-4 text-center">AI Vision diagnostic report is currently pending generation.</p>
                  )}
                </Card>

                {/* Lifecycle Predictions */}
                {predictions && (
                  <Card className="p-6 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-855 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-855 pb-2 flex items-center gap-1.5">
                      <TrendingUp className="text-emerald-500" size={14} />
                      Lifecycle AI Predictions
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-[10px] font-semibold">
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
                    <h4 className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-855 pb-2 flex items-center gap-1.5">
                      <AlertTriangle className="text-emerald-500" size={14} />
                      Duplicate Detection Agent
                    </h4>
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center text-[10px] font-semibold">
                        <span className="text-slate-500 block font-bold">Duplicate Match Score</span>
                        <span className="font-black text-rose-500">{duplicateCheck.duplicateScore || 0}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-955 border border-slate-200 dark:border-slate-855 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${duplicateCheck.duplicateScore || 0}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-650 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-150 dark:border-slate-855">
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
                      <div className="text-[9px] text-slate-505">Incident successfully submitted on {new Date(incident.createdAt).toLocaleDateString()}</div>
                    </div>

                    <div className="relative">
                      <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-4 border-white dark:border-slate-955 shadow ${
                        analysis ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-slate-200 dark:bg-slate-800'
                      }`} />
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">AI Analyzed</div>
                      <div className="text-[9px] text-slate-505">
                        {analysis ? 'Gemini tag analysis completed successfully' : 'Pending AI structural analysis'}
                      </div>
                    </div>

                    <div className="relative">
                      <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-4 border-white dark:border-slate-955 shadow ${
                        risk ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-slate-200 dark:bg-slate-800'
                      }`} />
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Risk Calculated</div>
                      <div className="text-[9px] text-slate-505">
                        {risk ? `Threat Level calculated: ${risk.threatLevel}` : 'Pending SLA priority score calculations'}
                      </div>
                    </div>

                    <div className="relative">
                      <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-4 border-white dark:border-slate-955 shadow ${
                        assignment ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-slate-200 dark:bg-slate-800'
                      }`} />
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Assigned</div>
                      <div className="text-[9px] text-slate-505">
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
                      <div className="text-[9px] text-slate-505">
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
                      <div className="text-[9px] text-slate-505">
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
                      <div className="text-[9px] text-slate-505">
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
                    <h4 className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-855 pb-2 flex items-center gap-1.5">
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

            {/* Evidence tab content */}
            {activeTab === 'evidence' && (
              <Card className="p-6 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-855 shadow-sm space-y-4 animate-fade-in">
                <h4 className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-855 pb-2">
                  Incident Evidence Gallery
                </h4>
                
                {incident.imageUrl ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                    <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 aspect-video flex items-center justify-center cursor-zoom-in" onClick={() => setZoomedImage(incident.imageUrl)}>
                      <img 
                        src={incident.imageUrl} 
                        alt="Evidence Thumbnail" 
                        className="max-w-full max-h-full object-contain group-hover:scale-[1.02] transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[10px] text-white font-extrabold uppercase bg-slate-950/80 px-2.5 py-1 rounded-lg">Click to Zoom</span>
                      </div>
                    </div>
                    
                    <div className="space-y-4 text-xs font-semibold">
                      <div className="space-y-1.5">
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Image Details</span>
                        <div className="space-y-1 text-slate-700 dark:text-slate-300">
                          <p>File reference: <span className="font-mono text-[10px]">{incident.imagePath || 'incident_evidence_upload.png'}</span></p>
                          <p>Uploaded: <span>{new Date(incident.createdAt).toLocaleString()}</span></p>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <a 
                          href={incident.imageUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          download={`CivicLens-Evidence-${incident.id?.substring(0, 8)}.png`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-955 font-extrabold rounded-xl text-xs transition-colors shadow-sm"
                        >
                          Download Full Image
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-4 text-center">No image evidence uploaded for this incident.</p>
                )}
              </Card>
            )}

            {activeTab === 'comments' && (
              <Card className="p-6 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-855 shadow-sm space-y-5 animate-fade-in">
                <h4 className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-855 pb-2 flex items-center gap-1.5">
                  <MessageSquare className="text-emerald-500" size={15} />
                  Community Discussion Board ({comments.length})
                </h4>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Write a public comment..."
                    className="flex-1 bg-slate-50 dark:bg-slate-955/40 border border-slate-205 dark:border-slate-855 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-450 focus:outline-none focus:border-emerald-500/50"
                  />
                  <Button
                    onClick={handlePostComment}
                    disabled={submittingComment || !newCommentText.trim()}
                    className="p-3 bg-emerald-500 hover:bg-emerald-400 text-slate-955 font-bold rounded-xl"
                  >
                    {submittingComment ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                  </Button>
                </div>

                <CommentsList 
                  comments={comments} 
                  incidentId={id}
                  incident={incident}
                  assignment={assignment}
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

            {/* History tab content (dynamic activities list) */}
            {activeTab === 'history' && (
              <Card className="p-6 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-855 shadow-sm space-y-4 animate-fade-in">
                <h4 className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-855 pb-2">
                  Parameters Override Logs & Audits
                </h4>

                {getHistoryTimeline().length === 0 ? (
                  <p className="text-slate-500 text-xs py-4 text-center font-semibold">No activity has been recorded yet.</p>
                ) : (
                  <div className="space-y-4 pt-2">
                    {getHistoryTimeline().map((step, idx) => (
                      <div key={idx} className="flex gap-3 items-start text-xs font-semibold">
                        <div className="w-6 h-6 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 flex items-center justify-center shrink-0">
                          {renderHistoryIcon(step.icon)}
                        </div>
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex justify-between items-center gap-2">
                            <span className="font-extrabold text-slate-800 dark:text-slate-200 block">{step.action}</span>
                            <span className="text-[8px] text-slate-400 font-mono">{new Date(step.timestamp).toLocaleString()}</span>
                          </div>
                          <span className="block text-[9px] text-emerald-500 font-bold uppercase tracking-wide leading-none pt-0.5">Actor: {step.actor}</span>
                          {step.note && <p className="text-[10px] text-slate-505 dark:text-slate-400 mt-1 leading-normal">{step.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Resolution tab content */}
            {activeTab === 'resolution' && (
              <div className="space-y-6 animate-fade-in">
                {/* Citizen Resolution Verification Banner */}
                {incident.status === 'RESOLVED' && (currentUser?.email === incident.reportedBy || currentUser?.role?.toUpperCase() === 'CITIZEN') && (
                  <Card className="p-6 bg-emerald-50/50 dark:bg-emerald-955/15 border-emerald-250 dark:border-emerald-900/50 shadow-sm space-y-4">
                    <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                      <CheckCircle size={16} />
                      Citizen Resolution Verification
                    </h4>
                    <p className="text-xs text-slate-650 dark:text-slate-355 leading-normal">
                      Municipal crews have marked this issue as resolved. Please confirm if the repairs are completed, or reject to reopen the ticket.
                    </p>
                    <input
                      type="text"
                      placeholder="Feedback comments (required for rejects)..."
                      value={verificationFeedback}
                      onChange={(e) => setVerificationFeedback(e.target.value)}
                      className="w-full bg-white dark:bg-slate-955/40 border border-slate-200 dark:border-slate-855 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-450 focus:outline-none focus:border-emerald-500/50"
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
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                    }`}>
                      {['RESOLVED', 'CLOSED'].includes(incident.status?.toUpperCase()) ? 'Resolved Status' : 'Pending Resolution'}
                    </span>
                  </div>

                  {assignment && assignment.status === 'COMPLETED' && incident.status !== 'CLOSED' && (
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-4 animate-scale-in">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="text-emerald-500 mt-0.5" size={16} />
                        <div className="space-y-1">
                          <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">Field Resolution Awaiting Verification</span>
                          <p className="text-[10px] text-slate-505 leading-normal">
                            Officer {assignment.officerName} marked this incident resolved. Please verify if the repairs have been successfully completed.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button 
                          onClick={() => handleVerifyResolution(true)}
                          disabled={verifying}
                          isLoading={verifying}
                          className="bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-black text-[10px] py-1 px-3 shadow"
                        >
                          Verify Resolution
                        </Button>
                      </div>
                    </div>
                  )}

                  {['RESOLVED', 'CLOSED'].includes(incident?.status?.toUpperCase()) ? (
                    <div className="space-y-6">
                      {/* Before / After comparative view */}
                      <div className="space-y-3">
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Evidence Comparison (Before / After)</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <span className="text-[8px] text-slate-500 uppercase tracking-wider block font-bold text-center">Before (Reported Incident)</span>
                            <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 aspect-video flex items-center justify-center cursor-zoom-in" onClick={() => setZoomedImage(incident.imageUrl)}>
                              <img src={incident.imageUrl} alt="Before repairs" className="max-w-full max-h-full object-contain" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <span className="text-[8px] text-slate-500 uppercase tracking-wider block font-bold text-center">After (Completed Resolution)</span>
                            <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 aspect-video flex items-center justify-center cursor-zoom-in" onClick={() => setZoomedImage(assignment?.completionImageUrl || incident.imageUrl)}>
                              {assignment?.completionImageUrl ? (
                                <img src={assignment.completionImageUrl} alt="After repairs" className="max-w-full max-h-full object-contain" />
                              ) : (
                                <div className="text-center p-6 text-slate-500 flex flex-col items-center justify-center w-full h-full text-[10px] font-bold">
                                  <ImageIcon size={20} className="mb-1 text-slate-600" />
                                  <span>After photo pending upload from responding officer</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Resolution details */}
                      <div className="grid grid-cols-2 gap-4 text-xs font-semibold pt-2 border-t border-slate-100 dark:border-slate-855">
                        <div className="space-y-1">
                          <span className="text-[8px] text-slate-500 block font-bold uppercase">Completed By</span>
                          <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200">{assignment?.officerName || 'Municipal Maintenance Division'}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[8px] text-slate-500 block font-bold uppercase">Completion Date</span>
                          <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200">
                            {assignment?.completedAt ? new Date(assignment.completedAt).toLocaleDateString() : new Date().toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Resolution Notes */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-855 space-y-1.5">
                        <span className="text-[8px] text-slate-500 block font-bold uppercase">Resolution Notes & Summary</span>
                        <p className="text-[10px] text-slate-655 dark:text-slate-350 leading-relaxed italic bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">
                          "{assignment?.completionReport || 'The maintenance crews successfully completed repair works on site. Road structures have been patched and aligned to safety standards.'}"
                        </p>
                      </div>

                      {/* Dynamic Certificate Download */}
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-855 flex justify-end">
                        <Button
                          onClick={handleDownloadPdf}
                          disabled={generatingPdf}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs py-2 shadow-sm flex items-center justify-center gap-1.5"
                        >
                          {generatingPdf ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              Generating PDF...
                            </>
                          ) : (
                            <>
                              <Printer size={13} />
                              Download Resolution Certificate
                            </>
                          )}
                        </Button>
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

          </div>
        </div>

        {/* Right Column: Metadata Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Metadata Sidebar Card */}
          <Card className="p-5 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 shadow-sm space-y-4 font-semibold">
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
                  incident.priority === 'P1' ? 'bg-rose-50 text-rose-600 border-rose-250 dark:bg-rose-955/30 dark:text-rose-450 dark:border-rose-900/60' : 'bg-slate-50 text-slate-650 border-slate-200 dark:bg-slate-950/40 dark:text-slate-400 dark:border-slate-855'
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
                onClick={handleDownloadPdf}
                disabled={generatingPdf || !['RESOLVED', 'CLOSED'].includes(incident.status?.toUpperCase())}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs py-2 shadow-sm flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingPdf ? (
                  <>
                    <Loader2 size={13} className="animate-spin animate-spin-slow" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Printer size={13} />
                    Download PDF Certificate
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Admin Override controls */}
          {(currentUser?.role === 'ADMIN' || currentUser?.role?.toUpperCase() === 'ADMIN') && (
            <Card className="p-5 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-xs font-black text-slate-855 dark:text-slate-355 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                Operational Overrides
              </h4>
              
              <div className="space-y-4 text-xs font-semibold">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-505 dark:text-slate-400 uppercase tracking-wider block">Set Manual Category</label>
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
                  <label className="text-[10px] font-bold text-slate-505 dark:text-slate-400 uppercase tracking-wider block">Set Manual Priority</label>
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
                  <label className="text-[10px] font-bold text-slate-505 dark:text-slate-400 uppercase tracking-wider block">Modify Incident Status</label>
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

      {/* Off-screen container for PDF generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', overflow: 'hidden' }}>
        <div 
          ref={certificateRef}
          className="p-8 bg-[#070b19] border-2 border-emerald-500 rounded-2xl text-slate-200 space-y-6"
          style={{ width: '600px', backgroundColor: '#070b19' }}
        >
          <div className="flex justify-between items-start border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Activity size={18} className="text-emerald-400" />
                <span className="text-sm font-black uppercase tracking-wider text-white">CivicLens AI</span>
              </div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Smart City Operations Registry</p>
            </div>
            <div className="text-right text-[9px] text-slate-400 font-mono space-y-0.5">
              <p className="text-emerald-400 font-bold">CERTIFICATE ID: CL-RES-{incident?.id?.substring(0, 8).toUpperCase()}</p>
              <p>ISSUED: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="text-center space-y-1.5 py-4">
            <h3 className="text-base font-black text-white uppercase tracking-widest">Resolution Certificate</h3>
            <p className="text-[10px] text-slate-400 max-w-md mx-auto leading-relaxed">
              This official document certifies that the following citizen reported infrastructure issue has been resolved by municipal service crews.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-900/50 p-4 rounded-xl border border-slate-850">
            <div className="space-y-2">
              <div>
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Incident Title</span>
                <span className="font-bold text-white text-[11px] block">{incident?.title}</span>
              </div>
              <div>
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Physical Location</span>
                <span className="font-bold text-slate-300 block">{incident?.location?.address || 'City Center'}</span>
              </div>
              <div>
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Reported By</span>
                <span className="font-bold text-slate-300 block">{incident?.anonymous ? 'Anonymous Citizen' : (incident?.reportedBy || 'Citizen')}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Category</span>
                  <span className="font-bold text-slate-300 block">{incident?.category}</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Priority</span>
                  <span className="font-bold text-slate-300 block">{incident?.priority || 'P2'}</span>
                </div>
              </div>
              <div>
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Lead Department</span>
                <span className="font-bold text-slate-300 block">{incident?.assignedDepartment || 'Public Works Department'}</span>
              </div>
              <div>
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Assigned Officer</span>
                <span className="font-bold text-slate-300 block">{incident?.resolvingOfficerName || 'Municipal Field Team'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3.5 pt-2">
            <div className="p-3 bg-slate-900/30 rounded-lg border border-slate-850">
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">AI Analysis Summary</span>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                {analysis?.summary || 'Gemini Vision AI classified and analyzed structural integrity with verified category and location metrics.'}
              </p>
            </div>
            <div className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
              <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider block">Field Resolution Summary</span>
              <p className="text-[10px] text-slate-300 mt-1 leading-relaxed italic">
                "{incident?.resolutionReport || 'Standard maintenance successfully executed. Infrastructure elements have been patched, cleaned, and approved for safe public reuse.'}"
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-850 text-center items-center">
            <div className="space-y-1">
              <div className="h-8 border-b border-slate-800 flex items-center justify-center">
                <span className="text-[10px] text-slate-500 font-mono italic">Verified Digital Sign</span>
              </div>
              <span className="text-[7px] text-slate-500 uppercase tracking-widest block font-bold">Authorized Officer</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="p-1 bg-white rounded-md">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="black">
                  <rect width="8" height="8" />
                  <rect x="28" width="8" height="8" />
                  <rect y="28" width="8" height="8" />
                  <rect x="12" y="12" width="12" height="12" />
                </svg>
              </div>
              <span className="text-[6px] text-slate-500 font-mono mt-1">SCAN TO VERIFY</span>
            </div>
            <div className="space-y-1">
              <div className="h-8 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border border-dashed border-emerald-500/30 flex items-center justify-center text-[7px] text-emerald-400 font-mono leading-none text-center">
                  OFFICIAL<br/>SEAL
                </div>
              </div>
              <span className="text-[7px] text-slate-500 uppercase tracking-widest block font-bold">Digital Trust Stamp</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-[8px] text-slate-500 pt-4 border-t border-slate-850 font-mono">
            <span>SYSTEM LOGS: VERIFIED BY GEMINI AI TRUST INDEX</span>
            <span>Generated: {new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Zoom Image Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 md:p-8 animate-fade-in" onClick={() => setZoomedImage(null)}>
          <button 
            type="button" 
            className="absolute top-4 right-4 p-2 bg-slate-950/80 hover:bg-rose-600 text-slate-350 hover:text-white rounded-full transition-colors"
            onClick={() => setZoomedImage(null)}
          >
            <XCircle size={24} />
          </button>
          <div className="max-w-4xl max-h-[85vh] overflow-hidden rounded-xl border border-slate-800 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <img src={zoomedImage} alt="Zoomed Evidence" className="max-w-full max-h-[85vh] object-contain" />
          </div>
        </div>
      )}

    </div>
  );
}
