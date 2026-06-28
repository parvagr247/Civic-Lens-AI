import React, { useState } from 'react';
import { trackIncident, requestOtp, verifyOtp, submitAnonymous } from '../services/issueService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/ToastProvider';
import { 
  Search, ShieldAlert, Clock, CheckCircle2, AlertTriangle, 
  MapPin, HelpCircle, User, MessageSquare, Clipboard, Send, 
  Sparkles, FileText, Upload 
} from 'lucide-react';

/**
 * AnonymousTracker Page.
 * Allows anonymous citizens to request OTP, verify contact parameters,
 * file reports, and track status parameters without registration.
 */
export default function AnonymousTracker() {
  const { toast } = useToast();
  
  // Tracking Tab States
  const [trackingId, setTrackingId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  // OTP Simulation States (for reporting anonymously)
  const [reportingAnonymously, setReportingAnonymously] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [simulatedCode, setSimulatedCode] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [verified, setVerified] = useState(false);
  const [activeTrackingId, setActiveTrackingId] = useState('');

  // Submit report states
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newFile, setNewFile] = useState(null);
  const [submittingReport, setSubmittingReport] = useState(false);

  // Track lookup handler
  const handleLookup = async (e) => {
    e.preventDefault();
    if (!trackingId.trim()) return;
    setLoading(true);
    setReport(null);
    try {
      const res = await trackIncident(trackingId);
      if (res.success) {
        setReport(res.data);
        toast('Report retrieved successfully!', 'success');
      } else {
        toast('No report found matching tracking reference.', 'error');
      }
    } catch (err) {
      toast('No report found matching tracking reference.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // OTP Simulation Request
  const handleRequestOtp = async () => {
    if (!emailOrPhone.trim()) return;
    try {
      const res = await requestOtp(emailOrPhone);
      if (res.success) {
        setOtpSent(true);
        setSimulatedCode(res.data.otpCode);
        setActiveTrackingId(res.data.trackingId);
        toast('Simulated verification code sent successfully!', 'success');
      }
    } catch (err) {
      toast('Failed to request OTP code.', 'error');
    }
  };

  // OTP Simulation Verification
  const handleVerifyOtp = async () => {
    try {
      const res = await verifyOtp(emailOrPhone, otpCode);
      if (res.success && res.data.verified) {
        setVerified(true);
        toast('OTP verified! You can now submit the report.', 'success');
      } else {
        toast('Invalid verification code.', 'error');
      }
    } catch (err) {
      toast('Failed to verify OTP code.', 'error');
    }
  };

  // Anonymous Report Submission
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!newTitle || !newDesc || !newFile) {
      toast('Please fill out all mandatory fields.', 'warning');
      return;
    }

    setSubmittingReport(true);
    const fd = new FormData();
    fd.append('title', newTitle);
    fd.append('description', newDesc);
    fd.append('image', newFile);
    fd.append('category', 'ROADS'); // Fallback category
    fd.append('latitude', '45.52'); // Mock portland coords
    fd.append('longitude', '-122.68');
    fd.append('address', 'Metropolitan central sector');

    try {
      const res = await submitAnonymous(fd, activeTrackingId);
      if (res.success) {
        toast(`Anonymous report submitted! Tracking ID: ${activeTrackingId}`, 'success');
        setTrackingId(activeTrackingId);
        setReport(res.data);
        // Reset reporting form
        setReportingAnonymously(false);
        setEmailOrPhone('');
        setOtpSent(false);
        setOtpCode('');
        setVerified(false);
        setNewTitle('');
        setNewDesc('');
        setNewFile(null);
      }
    } catch (err) {
      toast('Failed to submit report anonymously.', 'error');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Get Priority badge colors
  const getPriorityColor = (p) => {
    switch (p) {
      case 'P1': return 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400';
      case 'P2': return 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400';
      default: return 'bg-slate-50 border-slate-200 text-slate-650 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 text-slate-900 dark:text-slate-100">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Anonymous Tracking & Reporting</h2>
        <p className="text-xs text-slate-550 mt-1">
          File a complaint without registering, verify via simulated OTP contact numbers, and lookup resolution status parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Control Panel: Actions */}
        <div className="md:col-span-4 space-y-4">
          
          {/* Tracking Search Card */}
          <Card className="p-5 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Search size={14} className="text-emerald-500" />
              Track Report
            </h4>
            
            <form onSubmit={handleLookup} className="space-y-3">
              <input
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="CL-2026-X8392..."
                className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-450 focus:outline-none focus:border-emerald-500/50"
              />
              <Button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs py-2 font-bold shadow rounded-xl">
                {loading ? 'Searching...' : 'Lookup Reference'}
              </Button>
            </form>
          </Card>

          {/* Toggle File Anonymously Card */}
          <Card className="p-5 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-emerald-500" />
              New Anonymous Report
            </h4>
            <p className="text-[10px] text-slate-500 leading-normal">
              File a report without creating an account. OTP verification is required to prevent spam entries.
            </p>
            <Button
              onClick={() => setReportingAnonymously(!reportingAnonymously)}
              variant="outline"
              className="w-full text-xs font-bold py-2 rounded-xl"
            >
              {reportingAnonymously ? 'Cancel Report' : 'File Report Anonymously'}
            </Button>
          </Card>
        </div>

        {/* Right Panel: Content Viewport */}
        <div className="md:col-span-8 space-y-6">

          {/* Anonymous Reporting Wizard Form */}
          {reportingAnonymously && (
            <Card className="p-6 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 shadow-sm space-y-5 animate-scale-in">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-850 pb-2">
                Anonymous Reporting Wizard
              </h3>

              {!verified ? (
                // OTP Step
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Enter Email or Phone</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={emailOrPhone}
                        onChange={(e) => setEmailOrPhone(e.target.value)}
                        placeholder="citizen@mail.com or +15551234"
                        className="flex-1 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs"
                      />
                      <Button onClick={handleRequestOtp} disabled={!emailOrPhone.trim()} className="bg-emerald-500 text-slate-950 text-xs px-3 font-bold rounded-xl shadow">
                        Send OTP
                      </Button>
                    </div>
                  </div>

                  {otpSent && (
                    <div className="space-y-3.5 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-150 dark:border-slate-850 animate-fade-in">
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        Simulated SMS/Email code: <span className="font-mono font-black text-xs px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 rounded border border-emerald-200 dark:border-emerald-900/40 ml-1">{simulatedCode}</span>
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-500 uppercase block">Enter Verification Code</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            placeholder="0000"
                            className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-center text-xs tracking-widest font-mono"
                          />
                          <Button onClick={handleVerifyOtp} disabled={!otpCode.trim()} className="bg-emerald-500 text-slate-950 text-xs px-4 font-bold rounded-xl shadow">
                            Verify Code
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Submit Form Step
                <form onSubmit={handleSubmitReport} className="space-y-4 animate-fade-in">
                  <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20 text-[10px] font-semibold">
                    Simulated verification validated. Tracking session reference reserved: <span className="font-mono font-black ml-1">{activeTrackingId}</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Title *</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Pothole repair at Main St..."
                      className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Description *</label>
                    <textarea
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Provide full site damages details..."
                      rows={3}
                      className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Attachment Image *</label>
                    <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-500/30 transition-colors relative bg-slate-50/50 dark:bg-slate-950/20">
                      <input
                        type="file"
                        onChange={(e) => setNewFile(e.target.files[0])}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        required
                      />
                      <Upload size={22} className="text-slate-400" />
                      <span className="text-[10px] text-slate-500 mt-2 font-semibold">
                        {newFile ? newFile.name : 'Click to upload damages photo'}
                      </span>
                    </div>
                  </div>

                  <Button type="submit" disabled={submittingReport} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs py-2.5 font-bold shadow rounded-xl">
                    {submittingReport ? 'Submitting Report...' : 'Submit Anonymous Report'}
                  </Button>
                </form>
              )}
            </Card>
          )}

          {/* Search Result Report View */}
          {report ? (
            <Card className="p-6 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-850 shadow-sm space-y-6 animate-scale-in">
              <div className="flex justify-between items-start gap-4 border-b border-slate-100 dark:border-slate-850 pb-3">
                <div>
                  <Badge className="bg-slate-900 text-slate-400 border border-slate-800 text-[8px] font-black uppercase tracking-wider font-mono">
                    REF: {report.trackingId || 'CL-2026-SEEDED'}
                  </Badge>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mt-1.5">{report.title}</h3>
                </div>
                <Badge className="bg-emerald-500 text-slate-950 text-[9px] font-black uppercase">
                  {report.status}
                </Badge>
              </div>

              {/* Description */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-xl">
                <span className="text-[9px] text-slate-450 uppercase font-black tracking-wider block">Description Details</span>
                <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed mt-1 font-semibold">{report.description}</p>
              </div>

              {/* Visual timeline */}
              <div className="space-y-3.5">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Clock size={12} />
                  Resolution Timeline
                </h4>
                
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold">
                    Submitted
                  </div>
                  <div className={`p-2.5 border rounded-xl font-bold ${
                    ['INVESTIGATING', 'ASSIGNED', 'RESOLVED', 'CLOSED'].includes(report.status)
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-50 border-slate-200 text-slate-450 dark:bg-slate-950/20 dark:border-slate-850'
                  }`}>
                    Dispatched
                  </div>
                  <div className={`p-2.5 border rounded-xl font-bold ${
                    ['RESOLVED', 'CLOSED'].includes(report.status)
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-50 border-slate-200 text-slate-450 dark:bg-slate-950/20 dark:border-slate-850'
                  }`}>
                    Resolved
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            !reportingAnonymously && (
              <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850 p-8 rounded-xl text-center text-slate-500 space-y-2">
                <FileText size={28} className="mx-auto text-slate-400" />
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">No active tracking search</h4>
                <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-normal">
                  Enter a valid tracking identifier on the left control panel to review progress logs.
                </p>
              </div>
            )
          )}
        </div>

      </div>

    </div>
  );
}
