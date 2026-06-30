import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Activity, ArrowRight, Camera, Cpu, Landmark, 
  Trash2, Droplet, LightbulbOff, Wrench, Waves, 
  ShieldAlert, TrafficCone, Shield, CheckCircle, 
  Users, Mail, Menu, X, ArrowUp, ArrowLeft
} from 'lucide-react';
import { isAuthenticated, getCurrentUser } from '../services/authService';

const GithubIcon = (props) => (
  <svg 
    viewBox="0 0 24 24" 
    width="20" 
    height="20" 
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
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#070b19] text-white overflow-hidden font-sans selection:bg-emerald-500/30 selection:text-emerald-400">
      
      {/* City Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293705_1px,transparent_1px),linear-gradient(to_bottom,#1f293705_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Background ambient light effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/5 blur-[130px] pointer-events-none" />

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#070b19]/80 backdrop-blur-md transition-all duration-300">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
          
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('home')}>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500 text-slate-955 shadow-md">
              <Activity className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-md tracking-wider text-white">
              CivicLens AI
            </span>
          </div>

          {/* Minimal Nav */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-400">
            <button onClick={() => scrollToSection('home')} className="hover:text-white transition-colors">Home</button>
            <button onClick={() => navigate('/analyze')} className="hover:text-white transition-colors">Report Issue</button>
            <button onClick={() => navigate('/track')} className="hover:text-white transition-colors">Track Report</button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors">About</button>
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
              onClick={() => navigate('/analyze')} 
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-955 transition-all shadow-lg active:scale-95 animate-fade-in"
            >
              Report Issue
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
            <button onClick={() => scrollToSection('home')} className="text-left py-1 text-slate-300 font-bold hover:text-white">Home</button>
            <button onClick={() => navigate('/analyze')} className="text-left py-1 text-slate-300 font-bold hover:text-white">Report Issue</button>
            <button onClick={() => navigate('/track')} className="text-left py-1 text-slate-300 font-bold hover:text-white">Track Report</button>
            <button onClick={() => scrollToSection('how-it-works')} className="text-left py-1 text-slate-300 font-bold hover:text-white">About</button>
            <div className="h-[1px] bg-slate-800 my-1" />
            <div className="flex gap-4">
              <button onClick={() => navigate('/login')} className="flex-1 py-2 rounded-xl text-center text-xs font-bold border border-slate-700 text-slate-300">Login</button>
              <button onClick={() => navigate('/analyze')} className="flex-1 py-2 rounded-xl text-center text-xs font-bold bg-emerald-500 text-slate-955">Report Issue</button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 grid lg:grid-cols-12 gap-12 items-center" id="home">
        
        {/* Left Side: Copywriting & CTAs */}
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
            Report Civic Issues. <br />
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              Improve Your City.
            </span>
          </h1>

          <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
            Upload a photo of a civic issue and let AI identify, categorize, and forward it to the right municipal department.
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
            <button 
              onClick={() => navigate('/analyze')} 
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-955 text-xs font-black rounded-xl transition-all shadow-xl shadow-emerald-500/10 flex items-center gap-2 active:scale-95"
            >
              Report an Issue <ArrowRight size={14} />
            </button>
            <button 
              onClick={() => navigate('/track')} 
              className="px-6 py-3 bg-slate-905 hover:bg-slate-850 text-slate-200 border border-slate-800 text-xs font-black rounded-xl transition-all flex items-center gap-2 active:scale-95"
            >
              Track Existing Report
            </button>
          </div>
        </div>

        {/* Right Side: Clean Illustration */}
        <div className="lg:col-span-5 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-6 p-6 w-full max-w-sm bg-slate-900/30 border border-slate-850 rounded-2xl shadow-xl relative overflow-hidden">
            
            {/* Step 1: Citizen */}
            <div className="flex items-center gap-4 w-full bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl transition-colors hover:border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <Users size={18} />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-slate-200">Citizen</span>
                <span className="block text-[10px] text-slate-500 mt-0.5 font-semibold">Captures infrastructure anomaly</span>
              </div>
            </div>

            {/* Connecting dot line */}
            <div className="w-0.5 h-4 border-l border-dashed border-slate-800" />

            {/* Step 2: Upload Photo */}
            <div className="flex items-center gap-4 w-full bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl transition-colors hover:border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                <Camera size={18} />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-slate-200">Upload Photo</span>
                <span className="block text-[10px] text-slate-500 mt-0.5 font-semibold">Submits issue with address</span>
              </div>
            </div>

            {/* Connecting dot line */}
            <div className="w-0.5 h-4 border-l border-dashed border-slate-800" />

            {/* Step 3: AI Analysis */}
            <div className="flex items-center gap-4 w-full bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl transition-colors hover:border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                <Cpu size={18} />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-slate-200">AI Analysis</span>
                <span className="block text-[10px] text-slate-500 mt-0.5 font-semibold">Categorizes, geolocates & rates risk</span>
              </div>
            </div>

            {/* Connecting dot line */}
            <div className="w-0.5 h-4 border-l border-dashed border-slate-800" />

            {/* Step 4: Municipality */}
            <div className="flex items-center gap-4 w-full bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl transition-colors hover:border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <Landmark size={18} />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-slate-200">Municipality</span>
                <span className="block text-[10px] text-slate-500 mt-0.5 font-semibold">Assigns department for resolution</span>
              </div>
            </div>
            
          </div>
        </div>

      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-[#090e21] border-y border-slate-900 py-20">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">Workflow</span>
            <h2 className="text-3xl font-extrabold tracking-tight">How It Works</h2>
            <p className="text-slate-405 text-xs max-w-md mx-auto leading-relaxed font-semibold">
              CivicLens AI processes reports in three clear phases to resolve issues quickly.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            
            {/* Step 1 */}
            <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Camera size={22} />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Step 1</span>
                <h3 className="text-sm font-bold text-white">Upload a photo</h3>
                <p className="text-xs text-slate-400 leading-relaxed pt-1.5 font-semibold">
                  Take a photo of any civic issue. Upload it along with its street address.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Cpu size={22} />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Step 2</span>
                <h3 className="text-sm font-bold text-white">AI detects the issue</h3>
                <p className="text-xs text-slate-400 leading-relaxed pt-1.5 font-semibold">
                  Computer vision identifies the problem, gauges severity, and maps location data.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Landmark size={22} />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Step 3</span>
                <h3 className="text-sm font-bold text-white">Municipality receives the report</h3>
                <p className="text-xs text-slate-400 leading-relaxed pt-1.5 font-semibold">
                  The issue is dispatched to the correct municipal division for repair.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Report Types Section */}
      <section id="report-types" className="max-w-7xl mx-auto px-6 py-20 space-y-12">
        
        <div className="text-center space-y-3">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">Categories</span>
          <h2 className="text-3xl font-extrabold tracking-tight">Report Types</h2>
          <p className="text-slate-405 text-xs max-w-md mx-auto leading-relaxed font-semibold">
            We handle a wide range of municipal and public works issues.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            { icon: AlertTriangleIcon, title: 'Potholes', desc: 'Holes or cracks in road surfaces.' },
            { icon: Trash2, title: 'Garbage', desc: 'Overflowing bins or illegal litter.' },
            { icon: Droplet, title: 'Water Leakage', desc: 'Burst mains or broken hydrants.' },
            { icon: LightbulbOff, title: 'Broken Streetlights', desc: 'Malfunctioning or dark lampposts.' },
            { icon: Wrench, title: 'Road Damage', desc: 'Crumbling asphalt or sidewalk cracks.' },
            { icon: Waves, title: 'Drainage', desc: 'Clogged storm drains or street flooding.' },
            { icon: ShieldAlert, title: 'Illegal Dumping', desc: 'Unauthorized garbage abandonment.' },
            { icon: TrafficCone, title: 'Traffic Signal', desc: 'Damaged signs or broken traffic lights.' }
          ].map((type, idx) => (
            <div 
              key={idx} 
              onClick={() => navigate('/analyze')}
              className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 hover:border-emerald-500/40 transition-all duration-300 space-y-3 group cursor-pointer hover:-translate-y-1"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center transition-colors group-hover:bg-emerald-500 group-hover:text-slate-955">
                <type.icon size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{type.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1 font-semibold">{type.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* Why CivicLens Section */}
      <section id="why-civiclens" className="bg-[#090e21] border-y border-slate-900 py-20">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">Benefits</span>
            <h2 className="text-3xl font-extrabold tracking-tight">Why CivicLens</h2>
            <p className="text-slate-405 text-xs max-w-md mx-auto leading-relaxed font-semibold">
              Designed for ease of use, transparency, and fast resolution.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            
            {/* Benefit 1 */}
            <div className="bg-slate-950/25 border border-slate-855 p-6 rounded-2xl space-y-3 hover:border-slate-800 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center">
                <Cpu size={18} />
              </div>
              <h3 className="text-sm font-bold text-white">AI-powered issue detection</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Computer vision identifies the category, analyzes dimensions, and estimates severity instantly from photos.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="bg-slate-950/25 border border-slate-855 p-6 rounded-2xl space-y-3 hover:border-slate-800 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center">
                <Landmark size={18} />
              </div>
              <h3 className="text-sm font-bold text-white">Automatic department assignment</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Reports route automatically to appropriate public service divisions without manual sorting overhead.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="bg-slate-950/25 border border-slate-855 p-6 rounded-2xl space-y-3 hover:border-slate-800 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center">
                <Shield size={18} />
              </div>
              <h3 className="text-sm font-bold text-white">Real-time report tracking</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Trace dispatch steps, assigned inspectors, and resolution status with transparent tracking codes.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Final CTA Section */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Found a civic issue?</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto font-semibold">
          Help improve your city in under a minute. Submit a photo to request municipal repair dispatches.
        </p>
        <div className="pt-2">
          <button 
            onClick={() => navigate('/analyze')}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-955 text-xs font-black rounded-xl shadow-lg active:scale-95 transition-all inline-flex items-center gap-2"
          >
            Report an Issue <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          
          {/* Logo and Brand */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-500 text-slate-955 flex items-center justify-center font-bold">
              <Activity size={14} />
            </div>
            <span className="font-extrabold text-sm text-white">CivicLens AI</span>
          </div>

          {/* Minimal Copyright */}
          <div className="text-[10px] text-slate-500 font-bold">
            &copy; 2026 CivicLens AI. All rights reserved.
          </div>

          {/* Footer links */}
          <div className="flex flex-wrap justify-center gap-6 text-[10px] text-slate-500 font-bold">
            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer">Terms of Service</span>
            <span className="hover:text-white cursor-pointer">Contact Support</span>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-1">
              <GithubIcon className="w-3.5 h-3.5" />
              GitHub
            </a>
          </div>

        </div>
      </footer>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button 
          onClick={() => scrollToSection('home')}
          className="fixed bottom-6 right-6 p-2 rounded-xl bg-emerald-500 text-slate-955 shadow-lg hover:bg-emerald-400 active:scale-95 transition-all z-50 animate-fade-in"
          title="Scroll to Top"
        >
          <ArrowUp size={16} />
        </button>
      )}

    </div>
  );
}

// Local custom helper icons not directly in Lucide
function AlertTriangleIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
