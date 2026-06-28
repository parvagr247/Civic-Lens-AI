import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, ArrowRight, Eye, ShieldAlert, Cpu, Sparkles, 
  MessageSquare, Layout, Users, FileText, CheckCircle, 
  Heart, Star, HelpCircle, ArrowUpRight, Mail, 
  MapPin, Menu, X, ArrowUp, Shield
} from 'lucide-react';
import { isAuthenticated, getCurrentUser } from '../services/authService';

const Github = (props) => (
  <svg 
    viewBox="0 0 24 24" 
    width="24" 
    height="24" 
    stroke="currentColor" 
    strokeWidth="2" 
    fill="none" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function Landing() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState('citizen');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      const user = getCurrentUser();
      if (user?.role === 'ROLE_ADMIN') {
        navigate('/admin-dashboard');
      } else if (user?.role === 'ROLE_OFFICER') {
        navigate('/officer-dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [navigate]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#070b19] text-white overflow-hidden font-sans selection:bg-emerald-500/30 selection:text-emerald-400">
      
      {/* Animated City Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[130px] pointer-events-none" />

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#070b19]/80 backdrop-blur-md transition-all duration-300">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <span className="font-extrabold text-md tracking-wider text-white">
              CivicLens AI
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-400">
            <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Features</button>
            <button onClick={() => scrollToSection('ai-intelligence')} className="hover:text-white transition-colors">AI Intelligence</button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors">How It Works</button>
            <button onClick={() => scrollToSection('faq')} className="hover:text-white transition-colors">FAQ</button>
            <button onClick={() => scrollToSection('contact')} className="hover:text-white transition-colors">Contact</button>
          </nav>

          {/* Action Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <button 
              onClick={() => navigate('/login')} 
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-colors"
            >
              Login
            </button>
            <button 
              onClick={() => navigate('/register')} 
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
            >
              Get Started
            </button>
          </div>

          {/* Mobile menu trigger */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-800 bg-[#070b19] px-6 py-4 flex flex-col gap-4 animate-in slide-in-from-top duration-200">
            <button onClick={() => scrollToSection('features')} className="text-left py-1 text-slate-300 font-bold hover:text-white">Features</button>
            <button onClick={() => scrollToSection('ai-intelligence')} className="text-left py-1 text-slate-300 font-bold hover:text-white">AI Intelligence</button>
            <button onClick={() => scrollToSection('how-it-works')} className="text-left py-1 text-slate-300 font-bold hover:text-white">How It Works</button>
            <button onClick={() => scrollToSection('faq')} className="text-left py-1 text-slate-300 font-bold hover:text-white">FAQ</button>
            <button onClick={() => scrollToSection('contact')} className="text-left py-1 text-slate-300 font-bold hover:text-white">Contact</button>
            <div className="h-[1px] bg-slate-800 my-1" />
            <div className="flex gap-4">
              <button onClick={() => navigate('/login')} className="flex-1 py-2 rounded-xl text-center text-xs font-bold border border-slate-700 text-slate-300">Login</button>
              <button onClick={() => navigate('/register')} className="flex-1 py-2 rounded-xl text-center text-xs font-bold bg-emerald-500 text-slate-950">Get Started</button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 relative text-center space-y-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold tracking-wider uppercase animate-fade-in">
          <Sparkles size={11} className="animate-pulse" />
          <span>Next-Generation AI Smart City Operations</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight">
          Building Smarter Cities Through <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">Community + AI</span>
        </h1>

        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          CivicLens AI unites municipal authorities, operations teams, and citizen contributors. Detect infrastructure anomalies, automate risk classification, and streamline dispatching with Gemini Vision.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button 
            onClick={() => navigate('/register')} 
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-xl shadow-emerald-500/10 flex items-center gap-2 active:scale-95"
          >
            Explore Platform <ArrowRight size={14} />
          </button>
          <button 
            onClick={() => navigate('/track')} 
            className="px-6 py-3 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 text-xs font-black rounded-xl transition-all flex items-center gap-2 active:scale-95"
          >
            Report an Issue
          </button>
        </div>

        {/* Animated Smart City Node Graph */}
        <div className="w-full max-w-5xl mx-auto h-48 md:h-64 border border-slate-800/80 rounded-2xl bg-slate-950/40 relative overflow-hidden flex items-center justify-center shadow-inner">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent z-10" />
          
          {/* Node SVG Graph */}
          <svg className="w-full h-full stroke-emerald-500/10 stroke-[1.5] fill-none" viewBox="0 0 1000 300">
            <path d="M100,150 L300,50 L500,200 L700,80 L900,180" className="animate-pulse" />
            <path d="M100,150 L500,200 L900,180" />
            <path d="M300,50 L700,80" />
            <circle cx="100" cy="150" r="4" className="fill-emerald-500 stroke-emerald-400 animate-ping" />
            <circle cx="300" cy="50" r="4" className="fill-blue-500" />
            <circle cx="500" cy="200" r="4" className="fill-emerald-500" />
            <circle cx="700" cy="80" r="4" className="fill-blue-500" />
            <circle cx="900" cy="180" r="4" className="fill-emerald-500" />
          </svg>

          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center z-20 text-[10px] font-bold text-slate-500">
            <span>LIVE ANOMALY DETECTOR ENGINE</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              SYSTEM ACTIVE
            </span>
          </div>
        </div>
      </section>

      {/* Live Statistics */}
      <section className="border-y border-slate-900 bg-slate-950/40 py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
          {[
            { count: '14,822+', label: 'Reports Submitted' },
            { count: '8,211+', label: 'Active Citizens' },
            { count: '2.4 hrs', label: 'Avg Resolution Time' },
            { count: '98.6%', label: 'AI Diagnostic Accuracy' },
            { count: '12', label: 'Municipal Departments' },
          ].map((stat, idx) => (
            <div key={idx} className="space-y-1">
              <span className="block text-2xl md:text-3xl font-black bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">{stat.count}</span>
              <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Problem Statement */}
      <section className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">The Civic Challenge</span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            Traditional Reporting is Slow, Static, and Fragmented.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Most cities rely on legacy phone channels, emails, or slow web forms. Incidents are poorly categorised, severity assessment is delayed, and assigning dispatch teams takes days, leaving citizens in the dark.
          </p>
          <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-xl space-y-2">
            <span className="text-[10px] font-bold text-emerald-400 uppercase block">The CivicLens Solution</span>
            <p className="text-xs text-slate-450 leading-relaxed">
              We leverage AI-powered vision parsing to diagnose uploaded photos instantly. Algorithms assign severity ratings, dispatch coordinates to relevant departments, and keep communities informed in real-time.
            </p>
          </div>
        </div>

        {/* Visual Graphic */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 relative space-y-4 shadow-2xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <span className="text-[10px] font-bold text-slate-400">INCIDENT DISPATCH PERFORMANCE</span>
            <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">+86% Efficient</span>
          </div>

          <div className="space-y-3">
            {[
              { title: 'AI Automation Diagnostics', percent: '98%', color: 'from-emerald-500 to-emerald-400' },
              { title: 'Citizen Engagement Score', percent: '91%', color: 'from-blue-500 to-blue-400' },
              { title: 'Legacy Systems Latency', percent: '14%', color: 'from-rose-500 to-rose-400' },
            ].map((bar, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-400">{bar.title}</span>
                  <span>{bar.percent}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${bar.color} rounded-full`} style={{ width: bar.percent }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">Capabilities</span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Everything You Need to Manage a Smart City</h2>
          <p className="text-slate-400 text-xs max-w-xl mx-auto">
            A comprehensive suite of tools built on robust cloud frameworks and advanced large language models.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Eye, title: 'AI Vision Analysis', desc: 'Diagnoses road damage, waste, and leaks directly from uploaded photos with Gemini integration.' },
            { icon: ShieldAlert, title: 'Anonymous Reporting', desc: 'Secure tracking tokens allow citizen contributions without forcing public disclosure.' },
            { icon: Cpu, title: 'Risk Intelligence', desc: 'Assigns threat severity values dynamically based on public safety impact algorithms.' },
            { icon: MessageSquare, title: 'Community Collaboration', desc: 'Comment logs and upvote triggers to validate community reports collaboratively.' },
            { icon: Layout, title: 'Municipal Dashboard', desc: 'Consolidated admin workspace summarizing active dispatches, KPIs, and officer loads.' },
            { icon: Users, title: 'Officer Assignments', desc: 'Routes work orders straight to field inspectors with status ACCEPTED and IN_PROGRESS.' },
            { icon: FileText, title: 'Downloadable Reports', desc: 'Generates print-ready official PDF briefs including risk indicators and signatures.' },
            { icon: Sparkles, title: 'AI Copilot Chat', desc: 'Assists staff with dispatcher instructions, weather forecasts, and response drafts.' },
            { icon: Heart, title: 'Gamification Badges', desc: 'Grants XP tiers, leaderboards, and badges like "Pothole Patrol" to engage residents.' },
          ].map((feat, idx) => (
            <div key={idx} className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all duration-300 space-y-3 group hover:-translate-y-1">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center transition-colors group-hover:bg-emerald-500 group-hover:text-slate-950">
                <feat.icon size={16} />
              </div>
              <h3 className="text-sm font-bold text-white">{feat.title}</h3>
              <p className="text-xs text-slate-450 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Workflow Timeline */}
      <section id="ai-intelligence" className="bg-[#090e21] border-y border-slate-900 py-24">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">Automated Dispatch</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">The AI-Powered Resolution Workflow</h2>
            <p className="text-slate-400 text-xs max-w-xl mx-auto">
              How CivicLens AI routes a problem from citizen discovery to verified municipal closure.
            </p>
          </div>

          {/* Workflow Timeline Nodes */}
          <div className="grid md:grid-cols-4 lg:grid-cols-8 gap-6 relative">
            {[
              { step: '1', label: 'Citizen Upload', desc: 'Resident snaps and uploads an incident photo.' },
              { step: '2', label: 'Gemini Vision', desc: 'AI scans elements to identify category details.' },
              { step: '3', label: 'Risk Model', desc: 'System rates priority, safety impact, and SLA.' },
              { step: '4', label: 'Department', desc: 'Assigned automatically to relevant public works division.' },
              { step: '5', label: 'Dispatch', desc: 'Work order sent to active field officer console.' },
              { step: '6', label: 'Resolution', desc: 'Officer completes inspection and uploads evidence.' },
              { step: '7', label: 'Closure', desc: 'AI logs status as RESOLVED and updates timeline.' },
              { step: '8', label: 'Community Feed', desc: 'Local feed updates automatically for verification.' },
            ].map((node, idx) => (
              <div key={idx} className="relative space-y-3 text-center bg-slate-950/20 p-4 border border-slate-800/60 rounded-xl">
                <span className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 text-xs font-black flex items-center justify-center mx-auto">
                  {node.step}
                </span>
                <h4 className="text-[11px] font-extrabold text-white uppercase tracking-wider">{node.label}</h4>
                <p className="text-[9px] text-slate-500 leading-normal">{node.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-24 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">Interactive Preview</span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Explore the Experience Console</h2>
          <p className="text-slate-400 text-xs max-w-xl mx-auto">
            Toggle between specialized interfaces designed to manage city reports securely.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex justify-center border-b border-slate-850 gap-2 pb-px overflow-x-auto scrollbar-none">
          {[
            { id: 'citizen', label: 'Citizen Dashboard' },
            { id: 'admin', label: 'Admin Terminal' },
            { id: 'copilot', label: 'AI Copilot' },
            { id: 'community', label: 'Community Feed' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActivePreviewTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-all duration-200 whitespace-nowrap ${
                activePreviewTab === tab.id
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-350'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab contents (Mock Browser Frame) */}
        <div className="w-full max-w-4xl mx-auto border border-slate-800 rounded-2xl bg-slate-950/60 overflow-hidden shadow-2xl animate-fade-in">
          {/* Header */}
          <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-850 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <div className="bg-slate-950/40 text-[9px] text-slate-500 px-12 py-0.5 rounded border border-slate-850 truncate max-w-xs font-mono">
              https://civiclens.gov/console/{activePreviewTab}
            </div>
            <div className="w-8" />
          </div>

          {/* Render Mock UI */}
          <div className="p-6 h-64 md:h-80 overflow-y-auto text-xs text-slate-400 space-y-4 scrollbar-thin">
            {activePreviewTab === 'citizen' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                  <span className="font-extrabold text-slate-200 text-sm">Welcome Back, Citizen Contributor!</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">Rank: Active Contributor</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl text-center space-y-1">
                    <span className="block text-lg font-black text-emerald-400">120 XP</span>
                    <span className="block text-[8px] uppercase tracking-wider text-slate-500">Contribution Points</span>
                  </div>
                  <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl text-center space-y-1">
                    <span className="block text-lg font-black text-blue-400">4</span>
                    <span className="block text-[8px] uppercase tracking-wider text-slate-500">Issues Reported</span>
                  </div>
                  <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl text-center space-y-1">
                    <span className="block text-lg font-black text-amber-400">3</span>
                    <span className="block text-[8px] uppercase tracking-wider text-slate-500">Badges Unlocked</span>
                  </div>
                </div>
                <div className="border border-slate-800 rounded-xl p-3 bg-slate-900/10">
                  <span className="block font-bold text-slate-300 mb-1">Recent Incident Updates</span>
                  <p className="text-[10px] text-slate-505">Pothole reported on Elm St changed status to "WORK IN PROGRESS". Assigned officer: inspector John.</p>
                </div>
              </div>
            )}

            {activePreviewTab === 'admin' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                  <span className="font-extrabold text-slate-200 text-sm">Operations Command Terminal</span>
                  <span className="text-[9px] text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> SYSTEM NORMAL</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-slate-900/20 p-2 border border-slate-800/60 rounded-xl">
                    <span className="block text-[8px] uppercase text-slate-500">Total Alerts</span>
                    <span className="block font-bold text-slate-200">182 Active</span>
                  </div>
                  <div className="bg-slate-900/20 p-2 border border-slate-800/60 rounded-xl">
                    <span className="block text-[8px] uppercase text-slate-500">Unassigned</span>
                    <span className="block font-bold text-amber-400">8 Reports</span>
                  </div>
                  <div className="bg-slate-900/20 p-2 border border-slate-800/60 rounded-xl">
                    <span className="block text-[8px] uppercase text-slate-500">Critical Threats</span>
                    <span className="block font-bold text-rose-455">14 Flagged</span>
                  </div>
                  <div className="bg-slate-900/20 p-2 border border-slate-800/60 rounded-xl">
                    <span className="block text-[8px] uppercase text-slate-500">Avg Risk Rating</span>
                    <span className="block font-bold text-blue-400">6.8 / 10</span>
                  </div>
                </div>
                <div className="border border-slate-800 rounded-xl p-3 bg-slate-900/10">
                  <span className="block font-bold text-slate-300 mb-1">AI Diagnostics Dispatch Queue</span>
                  <p className="text-[10px] text-slate-505">Gemini suggests routing sanitation team to waste pile at intersection grid 4B. Risk: Medium.</p>
                </div>
              </div>
            )}

            {activePreviewTab === 'copilot' && (
              <div className="space-y-4 animate-fade-in h-full flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex gap-2.5 items-start">
                    <div className="w-6 h-6 rounded bg-emerald-500 text-slate-955 flex items-center justify-center font-bold text-[9px]">AI</div>
                    <div className="bg-slate-900 p-2.5 border border-slate-800 rounded-r-xl rounded-bl-xl text-[10px] leading-relaxed max-w-md">
                      Greetings dispatcher. I reviewed the reported water main leak at Sector 5. Weather forecast indicates light rain in 4 hours, which may double runoff volume. I recommend updating the assignment priority to **P1 Critical**.
                    </div>
                  </div>
                  <div className="flex gap-2.5 items-start justify-end">
                    <div className="bg-emerald-500/10 text-emerald-450 p-2.5 border border-emerald-500/20 rounded-l-xl rounded-br-xl text-[10px] leading-relaxed max-w-md">
                      Acknowledge. Generate dispatch instruction summary text for plumbing crew, please.
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 border-t border-slate-850 pt-2 shrink-0">
                  <input type="text" placeholder="Ask AI Copilot..." disabled className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-[10px]" />
                  <button disabled className="bg-emerald-500 text-slate-955 px-3 rounded-lg text-[9px] font-bold">Send</button>
                </div>
              </div>
            )}

            {activePreviewTab === 'community' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                  <span className="font-extrabold text-slate-200 text-sm">Community Contributions Feed</span>
                  <span className="text-[9px] text-slate-550">Sorting: Pinned & Recent</span>
                </div>
                <div className="border border-slate-800 rounded-xl p-3 bg-slate-900/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[9px]">AM</div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-300">Alex Municipal</span>
                      <span className="block text-[7px] text-slate-505">2 hours ago</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">Great work by the public services team! The broken water pipes on Lincoln Street were successfully welded and pressure tested this morning. Thanks everyone for upvoting!</p>
                  <div className="flex gap-4 text-[9px] text-slate-550 font-bold">
                    <span>▲ 18 Upvotes</span>
                    <span>💬 4 Comments</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="bg-slate-950/40 border-y border-slate-900 py-24">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">System Stack</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Built on Robust Enterprise Architectures</h2>
            <p className="text-slate-400 text-xs max-w-xl mx-auto">
              Engineered with advanced microservice constructs, secure cloud integrations, and reactive model handlers.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-center">
            {[
              { title: 'React', desc: 'Responsive UX & state orchestration' },
              { title: 'Spring Boot', desc: 'Secure APIs & core business logic' },
              { title: 'Spring AI', desc: 'Standardized model connectors' },
              { title: 'Gemini 1.5 Pro', desc: 'Multimodal Vision & Copilot logic' },
              { title: 'Firebase Auth', desc: 'Secure token checks' },
              { title: 'Cloud Firestore', desc: 'Dynamic document streams' },
              { title: 'Embabel', desc: 'Autonomous execution framework' },
              { title: 'Spring Modulith', desc: 'Modular microservice validation' },
            ].map((tech, idx) => (
              <div key={idx} className="bg-slate-900/30 border border-slate-800 p-4 rounded-xl space-y-1.5 hover:border-slate-700 transition-colors">
                <span className="block text-xs font-black text-emerald-400 uppercase tracking-wider">{tech.title}</span>
                <span className="block text-[9px] text-slate-500 leading-normal">{tech.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 py-24 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">Impact Stories</span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">What the Community is Saying</h2>
          <p className="text-slate-400 text-xs max-w-xl mx-auto">
            Read validation feedback from citizens, volunteers, municipal officers, and local NGOs.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {[
            { 
              name: 'Sarah Connor', 
              role: 'Citizen Contributor', 
              quote: 'Reporting potholes used to take weeks of chasing. With CivicLens, the AI categorized it instantly, and it was filled within 48 hours!',
              stars: 5 
            },
            { 
              name: 'Officer Davis', 
              role: 'Municipal Field Agent', 
              quote: 'The mobile dispatch log makes inspections simple. I receive photo diagnostics and clear locations directly on my officer dashboard console.',
              stars: 5 
            },
            { 
              name: 'Elena Rostova', 
              role: 'NGO Coordinator', 
              quote: 'Having public, structured data on city problems helps us focus our volunteer clean-ups much more effectively. Dynamic, realistic dashboard.',
              stars: 5 
            },
            { 
              name: 'Marcus Brody', 
              role: 'City Administrator', 
              quote: 'Information segregation is perfect. Staff see task boards, while residents get gamified podiums. It makes governance extremely modern.',
              stars: 5 
            },
          ].map((t, idx) => (
            <div key={idx} className="bg-slate-950/40 border border-slate-800 p-5 rounded-2xl space-y-4 hover:border-slate-750 transition-colors">
              <div className="flex gap-1 text-amber-400">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} size={12} className="fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-405 italic leading-relaxed">"{t.quote}"</p>
              <div className="border-t border-slate-850 pt-3">
                <span className="block text-[11px] font-bold text-white">{t.name}</span>
                <span className="block text-[9px] text-slate-500">{t.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="bg-[#090e21] border-y border-slate-900 py-24">
        <div className="max-w-4xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">Got Questions?</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-xs max-w-xl mx-auto">
              Everything you need to know about CivicLens AI roles, security, and operation mechanics.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { q: 'How does the AI Vision diagnostic engine work?', a: 'When a citizen uploads an image, Gemini Vision scans the graphic components to determine the category (Roads, Waste, Water, etc.), coordinates, and suggest priority markers.' },
              { q: 'Is registration required to submit an issue?', a: 'No. The platform supports Anonymous Tracking which lets users submit issues with custom security keys and trace completion status privately.' },
              { q: 'How is information security handled?', a: 'Roles are strictly separated. Citizens only interact with their profiles and community feeds. Operational consoles and officer logs are walled behind secure Auth guards.' },
              { q: 'How do citizens earn contribution points and XP?', a: 'XP is generated automatically through activities like reporting issues, having reports verified by officers, posting comments, and receiving upvotes.' },
              { q: 'What is the role of a municipal officer?', a: 'Officers receive dispatch requests from the administrator console. They accept, inspect, resolve incidents in the field, and upload completion evidence.' },
              { q: 'Can we download official PDF incident reports?', a: 'Yes. Every report includes a downloadable professional PDF brief featuring AI vision summaries, audit timelines, risk indices, and inspector sign-off sections.' },
              { q: 'What is the AI Copilot?', a: 'The AI Copilot is an interactive chat assistant powered by large language models, helping dispatchers generate work instructions, review weather projections, and query incident logs.' },
              { q: 'How are duplicate reports prevented?', a: 'The system uses Geo-location checking to flags similar categories reported nearby within the city grid, consolidating comments under a single report.' },
              { q: 'Does CivicLens AI support dark/light modes?', a: 'Yes. The system has responsive dark and light modes, persisting user theme preferences across dashboard panels.' },
              { q: 'How can our municipality adopt CivicLens AI?', a: 'Click the "Get Started" button or contact our support team. We can seed metadata logs and set up credentials for municipal divisions in minutes.' },
            ].map((faq, idx) => (
              <div key={idx} className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <HelpCircle size={14} className="text-emerald-400 shrink-0" />
                  {faq.q}
                </h4>
                <p className="text-xs text-slate-450 leading-relaxed pl-5">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="max-w-4xl mx-auto px-6 py-24 text-center space-y-8">
        <div className="space-y-3">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">Connect</span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Deploy CivicLens AI in Your City</h2>
          <p className="text-slate-400 text-xs max-w-xl mx-auto">
            Ready to transition to intelligent city operations? Get in touch with our SaaS deployment team today.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto text-left">
          <div className="bg-slate-950/40 border border-slate-805 p-4 rounded-xl flex items-center gap-3">
            <Mail className="text-emerald-400 shrink-0" size={16} />
            <div>
              <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold">Email Us</span>
              <span className="block text-xs font-bold text-slate-300">support@civiclens.gov</span>
            </div>
          </div>
          <div className="bg-slate-950/40 border border-slate-805 p-4 rounded-xl flex items-center gap-3">
            <Github className="text-emerald-400 shrink-0" size={16} />
            <div>
              <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold">Source Code</span>
              <span className="block text-xs font-bold text-slate-300">github.com/civiclens</span>
            </div>
          </div>
          <div className="bg-slate-950/40 border border-slate-805 p-4 rounded-xl flex items-center gap-3">
            <MapPin className="text-emerald-400 shrink-0" size={16} />
            <div>
              <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold">Headquarters</span>
              <span className="block text-xs font-bold text-slate-300">City Hall Annex, Grid 1</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-emerald-500 text-slate-955 flex items-center justify-center font-bold">
                <Activity size={14} />
              </div>
              <span className="font-extrabold text-sm text-white">CivicLens AI</span>
            </div>
            <p className="text-[10px] text-slate-505 leading-relaxed">
              Intelligent anomaly parsing, diagnostic workflows, and gamified civic collaboration mechanisms. Built for modern municipal ecosystems.
            </p>
          </div>

          <div>
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Product</h5>
            <ul className="text-[10px] text-slate-500 space-y-2 font-bold">
              <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Features</button></li>
              <li><button onClick={() => scrollToSection('ai-intelligence')} className="hover:text-white transition-colors">AI Diagnostics</button></li>
              <li><button onClick={() => navigate('/track')} className="hover:text-white transition-colors">Anonymous Log</button></li>
            </ul>
          </div>

          <div>
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Legal</h5>
            <ul className="text-[10px] text-slate-500 space-y-2 font-bold">
              <li><span className="hover:text-white cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:text-white cursor-pointer">Terms of Service</span></li>
              <li><span className="hover:text-white cursor-pointer">SLA Agreement</span></li>
            </ul>
          </div>

          <div>
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Contact</h5>
            <p className="text-[10px] text-slate-500 leading-normal font-semibold">
              Civic Operations Department<br />
              Municipal Building, 4th Floor<br />
              Email: support@civiclens.gov
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 border-t border-slate-900 mt-8 pt-8 flex justify-between items-center text-[10px] text-slate-505">
          <span>&copy; 2026 CivicLens AI. All rights reserved.</span>
          <div className="flex gap-4">
            <span className="hover:text-white cursor-pointer">Twitter</span>
            <span className="hover:text-white cursor-pointer">LinkedIn</span>
          </div>
        </div>
      </footer>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 p-2 rounded-xl bg-emerald-500 text-slate-955 shadow-lg hover:bg-emerald-400 active:scale-95 transition-all z-50"
          title="Scroll to Top"
        >
          <ArrowUp size={16} />
        </button>
      )}

    </div>
  );
}
