import React, { useEffect, useState } from 'react';
import { 
  getAssignmentsForOfficer, 
  updateAssignmentStatus, 
  getChatMessages, 
  sendChatMessage 
} from '../services/officerService';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Play, 
  MessageSquare, 
  Send, 
  Clock, 
  Award,
  BookOpen,
  FileText,
  User,
  ShieldCheck
} from 'lucide-react';
import { useToast } from '../components/ui/ToastProvider';
import { getCurrentUser } from '../services/authService';
import '../styles/officer/OfficerDashboard.css';

/**
 * OfficerDashboard component.
 * Allows field officers to accept, manage, resolve tasks, and chat with dispatchers.
 */
export default function OfficerDashboard() {
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Resolution Form States
  const [resolvingId, setResolvingId] = useState(null);
  const [internalNotes, setInternalNotes] = useState('');
  const [completionImage, setCompletionImage] = useState('');
  const [completionReport, setCompletionReport] = useState('');
  const [submittingResolution, setSubmittingResolution] = useState(false);

  // Chat States
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const fetchOfficerData = async () => {
    try {
      const response = await getAssignmentsForOfficer();
      if (response.success) {
        setAssignments(response.data || []);
      }
    } catch (err) {
      toast('Failed to load assignments.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficerData();
  }, []);

  const handleStatusUpdate = async (assignmentId, status) => {
    try {
      const res = await updateAssignmentStatus(assignmentId, status);
      if (res.success) {
        toast(`Task updated to ${status}!`, 'success');
        fetchOfficerData();
      }
    } catch (err) {
      toast('Failed to update task state.', 'error');
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!completionReport.trim()) {
      toast('Please supply completion report details.', 'warning');
      return;
    }
    setSubmittingResolution(true);
    try {
      const res = await updateAssignmentStatus(
        resolvingId, 
        'COMPLETED', 
        internalNotes, 
        completionImage || 'https://api.dicebear.com/7.x/identicon/svg?seed=resolved', 
        completionReport
      );
      if (res.success) {
        toast('Task marked COMPLETED successfully! points rewarded to reporter.', 'success');
        setResolvingId(null);
        setInternalNotes('');
        setCompletionImage('');
        setCompletionReport('');
        fetchOfficerData();
      }
    } catch (err) {
      toast('Failed to mark task completed.', 'error');
    } finally {
      setSubmittingResolution(false);
    }
  };

  const loadChatHistory = async (assignmentId) => {
    setActiveChatId(assignmentId);
    try {
      const res = await getChatMessages(assignmentId);
      if (res.success) {
        setMessages(res.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendChatMessage = async () => {
    if (!newMessageText.trim() || !activeChatId) return;
    setSendingMsg(true);
    try {
      const res = await sendChatMessage(activeChatId, newMessageText);
      if (res.success) {
        setNewMessageText('');
        // Reload history
        const updatedRes = await getChatMessages(activeChatId);
        if (updatedRes.success) setMessages(updatedRes.data || []);
      }
    } catch (err) {
      toast('Failed to send chat message.', 'error');
    } finally {
      setSendingMsg(false);
    }
  };

  // Stats derivation
  const now = Date.now();
  const pendingCount = assignments.filter(a => a.status !== 'COMPLETED' && a.status !== 'CLOSED').length;
  const completedCount = assignments.filter(a => a.status === 'COMPLETED' || a.status === 'CLOSED').length;
  
  // Day 6 Stats
  const overdueCount = assignments.filter(a => a.status !== 'COMPLETED' && a.status !== 'CLOSED' && a.deadline && now > a.deadline).length;
  const todaysTasksCount = assignments.filter(a => a.status !== 'COMPLETED' && a.status !== 'CLOSED' && a.deadline && (a.deadline - now) < 86400000 && (a.deadline - now) > 0).length;
  const upcomingDeadlinesCount = assignments.filter(a => a.status !== 'COMPLETED' && a.status !== 'CLOSED' && a.deadline && (a.deadline - now) > 86400000 && (a.deadline - now) < 259200000).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
        <span className="text-sm text-slate-400">Loading Officer Console...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 officer-dashboard text-foreground animate-fade-in">
      
      {/* Officer Header Card */}
      <Card className="p-6 bg-card border-border flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-2xl flex items-center justify-center shadow-md">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-foreground">Officer Operations Console</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Welcome, {currentUser?.name}. Manage your assigned maintenance and logistics dispatch pipeline.</p>
          </div>
        </div>
      </Card>

      {/* Aggregate metrics widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Performance & Ranking */}
        <Card className="p-4 bg-card border-border flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 rounded-xl">
            <Award size={20} />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold block">Department Rank</span>
            <span className="text-md font-black text-foreground">#3 in Public Works</span>
            <span className="text-[9px] text-amber-600 dark:text-amber-500 block font-bold">Rating: 4.9 / 5.0</span>
          </div>
        </Card>

        {/* Today's Tasks */}
        <Card className="p-4 bg-card border-border flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold block">Due Today</span>
            <span className="text-xl font-black text-foreground">{todaysTasksCount} Tasks</span>
          </div>
        </Card>

        {/* Overdue Alerts */}
        <Card className="p-4 bg-card border-border flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 rounded-xl">
            <AlertCircle size={20} />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold block">SLA Overdue</span>
            <span className="text-xl font-black text-rose-600">{overdueCount} Alerts</span>
          </div>
        </Card>

        {/* Completed Assignments */}
        <Card className="p-4 bg-card border-border flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-xl">
            <CheckCircle size={20} />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold block">Completed today</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{completedCount} Fixed</span>
          </div>
        </Card>
      </div>

      {/* Splits Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Worklist Assignments */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-card border border-border rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
              Your Task Assignments Worklist
            </h3>

            {assignments.length === 0 ? (
              <p className="text-muted-foreground text-xs py-8 text-center font-bold">No assignments scheduled currently.</p>
            ) : (
              <div className="space-y-4">
                {assignments.map(ass => (
                  <div key={ass.id} className="p-4 bg-gray-50/50 dark:bg-slate-950/40 border border-border dark:border-slate-800/80 rounded-xl space-y-3">
                    
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${
                          ass.priority === 'P1' 
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-250 dark:border-rose-900/60' 
                            : 'bg-gray-100 dark:bg-slate-900 text-gray-605 dark:text-slate-400 border-gray-250 dark:border-slate-800'
                        }`}>
                          Priority {ass.priority}
                        </span>
                        <h4 className="text-xs font-bold text-foreground mt-1.5">Assignment: {ass.id.substring(0, 8)}</h4>
                      </div>
                      
                      <Badge className="bg-gray-100 dark:bg-slate-900 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-800 text-[9px] font-black">
                        {ass.status}
                      </Badge>
                    </div>

                    <p className="text-[11px] text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-950/60 p-2.5 rounded-lg border border-gray-200 dark:border-slate-900 leading-relaxed shadow-sm">
                      <strong>Instructions:</strong> {ass.instructions || 'Perform standard inspection.'}
                    </p>

                    {/* Operational Controls based on assignment lifecycle */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {ass.status === 'ASSIGNED' && (
                        <>
                          <Button 
                            onClick={() => handleStatusUpdate(ass.id, 'ACCEPTED')}
                            size="sm"
                            variant="success"
                            className="text-[10px] font-bold py-1 px-3"
                          >
                            Accept Task
                          </Button>
                          <Button 
                            onClick={() => handleStatusUpdate(ass.id, 'REJECTED')}
                            size="sm"
                            variant="outline"
                            className="text-[10px] py-1 px-3 text-rose-600 dark:text-rose-400 border-border hover:bg-gray-100 dark:hover:bg-slate-800"
                          >
                            Reject
                          </Button>
                        </>
                      )}

                      {ass.status === 'ACCEPTED' && (
                        <Button 
                          onClick={() => handleStatusUpdate(ass.id, 'IN_PROGRESS')}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 text-white dark:text-slate-950 text-[10px] font-bold py-1 px-3 flex items-center gap-1 shadow-sm"
                        >
                          <Play size={10} />
                          Start Work
                        </Button>
                      )}

                      {ass.status === 'IN_PROGRESS' && (
                        <Button 
                          onClick={() => setResolvingId(ass.id)}
                          size="sm"
                          variant="success"
                          className="text-[10px] font-bold py-1 px-3"
                        >
                          Mark Resolved
                        </Button>
                      )}

                      <Button
                        onClick={() => loadChatHistory(ass.id)}
                        size="sm"
                        variant="outline"
                        className="text-[10px] py-1 px-3 flex items-center gap-1 border-border"
                      >
                        <MessageSquare size={10} />
                        Chat Dispatcher
                      </Button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Resolution Panel / Chat Room */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Resolution Drawer Form */}
          {resolvingId && (
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 animate-in slide-in-from-top-4 duration-300">
              <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest border-b border-border pb-2">
                Mark Incident Resolved
              </h3>
              
              <form onSubmit={handleResolveSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Fix Completion Image (URL)</label>
                  <input
                    type="text"
                    value={completionImage}
                    onChange={(e) => setCompletionImage(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-finished..."
                    className="w-full bg-white dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Internal Repair Notes</label>
                  <textarea
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Replaced cracked concrete foundation, patched P1..."
                    rows={2}
                    className="w-full bg-white dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Completion Summary Report *</label>
                  <textarea
                    value={completionReport}
                    onChange={(e) => setCompletionReport(e.target.value)}
                    placeholder="Public works department completed repair..."
                    rows={3}
                    className="w-full bg-white dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    variant="success"
                    className="flex-1 font-bold rounded-xl text-xs py-2 shadow"
                    disabled={submittingResolution}
                  >
                    {submittingResolution ? 'Submitting Report...' : 'Submit Resolution'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setResolvingId(null)}
                    className="border-border text-xs py-2 px-3 text-muted-foreground"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Dispatcher Messaging Drawer */}
          {activeChatId && (
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 flex flex-col h-[380px] justify-between">
              
              <div className="space-y-1.5 border-b border-border pb-2 shrink-0 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <MessageSquare size={13} className="text-emerald-500" />
                    Internal Chat logs
                  </h3>
                  <span className="text-[9px] text-muted-foreground block mt-0.5">Task Ref: {activeChatId.substring(0, 8)}</span>
                </div>
                <button 
                  onClick={() => setActiveChatId(null)}
                  className="text-[9px] font-bold text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
              </div>

              {/* Message transcript list */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 my-2 text-xs scrollbar-thin">
                {messages.length === 0 ? (
                  <p className="text-muted-foreground text-[10px] text-center py-10 font-medium">No messages. Type below to alert the administrator.</p>
                ) : (
                  messages.map(msg => {
                    const isSelfMsg = msg.senderId === currentUser?.userId;
                    return (
                      <div key={msg.id} className={`flex flex-col max-w-[80%] ${isSelfMsg ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                        <span className="text-[8px] font-black text-muted-foreground mb-0.5">{msg.senderName}</span>
                        <div className={`p-2 rounded-xl text-[10px] leading-relaxed ${
                          isSelfMsg 
                            ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-955 font-semibold shadow-sm' 
                            : 'bg-gray-100 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-800 dark:text-slate-300 shadow-sm'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input form */}
              <div className="flex gap-2 pt-2 border-t border-border shrink-0">
                <input
                  type="text"
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder="Type message to dispatcher..."
                  className="flex-1 bg-white dark:bg-slate-955/40 border border-gray-205 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 shadow-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                />
                <Button
                  onClick={handleSendChatMessage}
                  disabled={sendingMsg || !newMessageText.trim()}
                  variant="success"
                  className="p-2 font-bold rounded-xl"
                >
                  {sendingMsg ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Send size={12} />
                  )}
                </Button>
              </div>

            </div>
          )}

          {/* GIS Navigation Route Map Placeholder */}
          <Card className="p-5 bg-card border-border shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 flex items-center gap-1.5">
              <Clock size={13} className="text-emerald-500" />
              GIS Worksite Navigation
            </h3>
            <div className="h-40 rounded-xl bg-gray-50/50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-850 p-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
              <div className="text-[10px] text-muted-foreground font-bold">Recommended Service Route:</div>
              <div className="text-[11px] font-black text-foreground mt-1.5 flex flex-wrap items-center gap-1.5 justify-center">
                <span>Start: Municipal Yard Depot</span>
                <ChevronRight size={12} className="text-emerald-500" />
                <span>Destination: Assigned Worksite Address</span>
              </div>
              <span className="text-[9px] text-muted-foreground font-mono mt-3">Estimated Travel Time: 18 mins (2.4 miles)</span>
            </div>
          </Card>

        </div>

      </div>

    </div>
  );
}
