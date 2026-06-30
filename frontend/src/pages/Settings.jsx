import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/ToastProvider';
import { getCurrentUser, isAdmin } from '../services/authService';
import { 
  User, Bell, Lock, Laptop, Shield, Globe, 
  HelpCircle, Eye, Cpu, CheckCircle2, AlertTriangle, 
  Trash2, Download, LogOut, ChevronRight, Sparkles, 
  Database, Server, Loader2
} from 'lucide-react';

/**
 * Settings component.
 * Centralized, modern account management portal.
 */
export default function Settings() {
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  const isUserAdmin = isAdmin();

  // Navigation tab state
  // Tabs: 'account', 'profile', 'notifications', 'appearance', 'privacy', 'accessibility', 'preferences', 'about', 'developer' (admin only)
  const [activeCategory, setActiveCategory] = useState('account');

  // Handle URL query parameters (e.g. ?tab=privacy)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      if (tabParam === 'privacy') setActiveCategory('privacy');
      else if (tabParam === 'profile') setActiveCategory('profile');
      else if (tabParam === 'developer' && isUserAdmin) setActiveCategory('developer');
    }
  }, [isUserAdmin]);

  // Account States
  const [email, setEmail] = useState(currentUser?.email || '');
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [username, setUsername] = useState(currentUser?.name?.toLowerCase().replace(/\s/g, '') || '');
  
  // Profile States
  const [profileBio, setProfileBio] = useState('Active community member advocating for infrastructure improvements.');
  const [profileCity, setProfileCity] = useState('Portland');
  const [profileState, setProfileState] = useState('Oregon');
  const [profileCountry, setProfileCountry] = useState('United States');
  const [profileLanguage, setProfileLanguage] = useState('en');
  const [avatarUrl, setAvatarUrl] = useState('https://api.dicebear.com/7.x/bottts/svg?seed=fallback');

  // Notifications States
  const [notifStatus, setNotifStatus] = useState(true);
  const [notifAssigned, setNotifAssigned] = useState(true);
  const [notifResolved, setNotifResolved] = useState(true);
  const [notifReplies, setNotifReplies] = useState(false);
  const [notifAi, setNotifAi] = useState(true);
  const [notifUpdates, setNotifUpdates] = useState(false);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [notifWeekly, setNotifWeekly] = useState(false);

  // Appearance States
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [accentColor, setAccentColor] = useState('emerald');
  const [fontSize, setFontSize] = useState('medium');
  const [compactMode, setCompactMode] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Accessibility States
  const [highContrast, setHighContrast] = useState(false);
  const [largerText, setLargerText] = useState(false);
  const [keyboardNav, setKeyboardNav] = useState(false);
  const [screenReader, setScreenReader] = useState(false);
  const [reducedAnimations, setReducedAnimations] = useState(false);

  // Preferences States
  const [prefLang, setPrefLang] = useState('English (US)');
  const [prefTimezone, setPrefTimezone] = useState('GMT-08:00 (Pacific Time)');
  const [prefDateFormat, setPrefDateFormat] = useState('MM/DD/YYYY');
  const [prefDistance, setPrefDistance] = useState('Miles');
  const [prefTemp, setPrefTemp] = useState('Fahrenheit');
  const [prefMap, setPrefMap] = useState('Satellite');

  // Developer/Admin States
  const [adminModel, setAdminModel] = useState('gemini-2.5-flash');
  const [adminTemp, setAdminTemp] = useState(0.2);
  const [firebasePath, setFirebasePath] = useState('classpath:firebase-service-account.json');
  const [logVerbosity, setLogVerbosity] = useState('INFO');

  // Save Settings handler
  const handleSave = (sectionName) => {
    if (sectionName === 'appearance') {
      localStorage.setItem('theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      window.dispatchEvent(new Event('themeChange'));
    }
    toast(`${sectionName.toUpperCase()} preferences saved successfully!`, 'success');
  };

  const navItems = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Laptop },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'accessibility', label: 'Accessibility', icon: Eye },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    { id: 'about', label: 'About', icon: HelpCircle },
    ...(isUserAdmin ? [{ id: 'developer', label: 'Developer Settings', icon: Cpu }] : [])
  ];

  // Calculate profile completion index
  const calculateCompletion = () => {
    let score = 0;
    if (fullName) score += 20;
    if (profileBio) score += 20;
    if (profileCity) score += 20;
    if (profileState) score += 20;
    if (avatarUrl) score += 20;
    return score;
  };

  return (
    <div className="max-w-6xl mx-auto py-6 animate-fade-in text-slate-200">
      
      {/* Title */}
      <div className="border-b border-slate-850 pb-5 mb-8">
        <h2 className="text-2xl font-black text-white tracking-tight">System Settings</h2>
        <p className="text-xs text-slate-450 mt-1 font-medium">Manage profile configurations, system alerts, visual themes, and security integrations.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start w-full">
        
        {/* Left Side: Navigation List */}
        <div className="w-full md:w-60 shrink-0 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible border-b md:border-b-0 md:border-r border-slate-850 pb-3 md:pb-0 md:pr-5 gap-1 scrollbar-none">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeCategory === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveCategory(item.id)}
                className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all w-full text-left whitespace-nowrap md:whitespace-normal shrink-0 ${
                  isActive 
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/5' 
                    : 'border border-transparent text-slate-450 hover:text-white hover:bg-slate-900/40'
                }`}
              >
                <IconComponent size={14} className={isActive ? 'text-emerald-400' : 'text-slate-500'} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Right Side: Tab Panel Content */}
        <div className="flex-1 min-w-0 bg-slate-900/15 border border-slate-850 p-6 rounded-2xl shadow-xl w-full">
          
          {/* CATEGORY 1: ACCOUNT */}
          {activeCategory === 'account' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-white">Account Settings</h3>
                <p className="text-[11px] text-slate-450 mt-0.5">Manage credentials, primary contact parameters, and registration records.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950/30 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-950/30 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 bg-slate-950/30 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs focus:border-emerald-500/50 focus:outline-none font-medium"
                    />
                    <Button 
                      onClick={() => handleSave('account')}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-955 text-xs px-4 rounded-xl font-bold shadow active:scale-[0.98]"
                    >
                      Update Email
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-850 pt-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Metadata</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Portal Role</span>
                    <span className="font-extrabold text-slate-300 mt-1 block">
                      {isUserAdmin ? 'System Administrator' : 'Citizen Participant'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Member Since</span>
                    <span className="font-extrabold text-slate-300 mt-1 block">June 2026</span>
                  </div>
                  <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Verification Status</span>
                    <span className="font-extrabold text-emerald-450 mt-1 block flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      Verified Email
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-850 pt-5 space-y-3.5">
                <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wider">Danger Zone</h4>
                <div className="p-4 bg-rose-950/10 border border-rose-900/40 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Deactivate or Delete Account</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 max-w-md">Once deleted, all reported archive logs, comments, and profile points will be permanently cleared. This action is irreversible.</span>
                  </div>
                  <Button 
                    onClick={() => toast('Please contact support to initiate account deactivation.', 'warning')}
                    className="bg-rose-600 hover:bg-rose-500 text-white text-xs px-4 py-2 font-bold rounded-xl shrink-0 flex items-center gap-1.5 active:scale-[0.98]"
                  >
                    <Trash2 size={13} />
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY 2: PROFILE */}
          {activeCategory === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-white">Public Profile Settings</h3>
                <p className="text-[11px] text-slate-450 mt-0.5">Customize your public credentials displayed on incident collaboration feeds.</p>
              </div>

              {/* Progress Indicator */}
              <div className="space-y-1.5 p-4 bg-slate-950/30 border border-slate-850 rounded-xl">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-slate-400">Profile Completion</span>
                  <span className="text-emerald-400">{calculateCompletion()}% Completed</span>
                </div>
                <div className="h-1.5 w-full bg-slate-850 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${calculateCompletion()}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-5 items-center pb-2">
                <img 
                  src={avatarUrl} 
                  alt="Avatar Preview" 
                  className="w-16 h-16 rounded-2xl border border-slate-850 bg-slate-950 p-1 shrink-0 shadow-lg"
                />
                <div className="space-y-1.5 w-full text-center sm:text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avatar Seed URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      className="flex-1 bg-slate-950/30 border border-slate-850 rounded-xl px-3.5 py-2 text-xs focus:border-emerald-500/50 focus:outline-none"
                    />
                    <Button 
                      onClick={() => setAvatarUrl(`https://api.dicebear.com/7.x/bottts/svg?seed=${Math.random()}`)}
                      variant="outline"
                      className="text-xs font-bold py-2 border-slate-800 text-slate-350 hover:bg-slate-850 rounded-xl"
                    >
                      Randomize
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Biography</label>
                  <textarea
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    rows={3}
                    placeholder="Tell the community about your civic engagements..."
                    className="w-full bg-slate-955/30 border border-slate-850 rounded-xl px-3.5 py-2 text-xs focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">City</label>
                  <input
                    type="text"
                    value={profileCity}
                    onChange={(e) => setProfileCity(e.target.value)}
                    className="w-full bg-slate-950/30 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">State</label>
                  <input
                    type="text"
                    value={profileState}
                    onChange={(e) => setProfileState(e.target.value)}
                    className="w-full bg-slate-950/30 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Country</label>
                  <input
                    type="text"
                    value={profileCountry}
                    onChange={(e) => setProfileCountry(e.target.value)}
                    className="w-full bg-slate-950/30 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Preferred Display Language</label>
                  <select
                    value={profileLanguage}
                    onChange={(e) => setProfileLanguage(e.target.value)}
                    className="w-full bg-slate-950/30 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="en">English (US)</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button 
                  onClick={() => handleSave('profile')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-955 text-xs px-6 py-2.5 font-bold shadow rounded-xl active:scale-[0.98]"
                >
                  Save Profile Changes
                </Button>
              </div>
            </div>
          )}

          {/* CATEGORY 3: NOTIFICATIONS */}
          {activeCategory === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-white">Alert Notifications Preferences</h3>
                <p className="text-[11px] text-slate-450 mt-0.5">Toggle alert status triggers on re-assignments, status logs, and community interactions.</p>
              </div>

              <div className="space-y-3.5">
                {[
                  { id: 'status', label: 'Report Status Updates', desc: 'Receive updates when your reports undergo transition changes.', state: notifStatus, set: setNotifStatus },
                  { id: 'assign', label: 'Report Assigned', desc: 'Alert when municipal dispatch maps task logs to field inspectors.', state: notifAssigned, set: setNotifAssigned },
                  { id: 'resolve', label: 'Report Resolved', desc: 'Alert on repair completions and evidence validations.', state: notifResolved, set: setNotifResolved },
                  { id: 'replies', label: 'Community Replies', desc: 'Receive alerts when community members discuss your submissions.', state: notifReplies, set: setNotifReplies },
                  { id: 'ai', label: 'AI Analysis Completed', desc: 'Alert when vision diagnostics calculate risk factor categories.', state: notifAi, set: setNotifAi },
                  { id: 'updates', label: 'Product Updates', desc: 'Receive announcements about new civic tools and releases.', state: notifUpdates, set: setNotifUpdates },
                  { id: 'email', label: 'Email Notifications', desc: 'Forward alert summaries to your primary email address.', state: notifEmail, set: setNotifEmail },
                  { id: 'push', label: 'Push Notifications', desc: 'Send real-time alerts straight to your browser application.', state: notifPush, set: setNotifPush },
                  { id: 'weekly', label: 'Weekly Summary', desc: 'Receive a consolidated summary email of local neighborhood activities.', state: notifWeekly, set: setNotifWeekly }
                ].map((notifItem) => (
                  <div key={notifItem.id} className="flex items-start justify-between gap-4 p-3 bg-slate-950/30 border border-slate-850/60 rounded-xl">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-200 block">{notifItem.label}</span>
                      <span className="text-[10px] text-slate-500 block leading-normal">{notifItem.desc}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                      <input 
                        type="checkbox" 
                        checked={notifItem.state} 
                        onChange={(e) => notifItem.set(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-slate-955 peer-checked:after:border-slate-955" />
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <Button 
                  onClick={() => handleSave('notifications')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-955 text-xs px-6 py-2.5 font-bold shadow rounded-xl active:scale-[0.98]"
                >
                  Save Notification Toggles
                </Button>
              </div>
            </div>
          )}

          {/* CATEGORY 4: APPEARANCE */}
          {activeCategory === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-white">Appearance Settings</h3>
                <p className="text-[11px] text-slate-450 mt-0.5">Customize theme elements, visual styling, text size, and animation settings.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Visual Theme</label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full bg-slate-955/35 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="light">Light contrast theme</option>
                    <option value="dark">Sleek dark mode theme</option>
                    <option value="system">System Default</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Accent Color</label>
                  <select
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-full bg-slate-955/35 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="emerald">Emerald (Default)</option>
                    <option value="blue">Slate Blue</option>
                    <option value="indigo">Royal Indigo</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Font Size</label>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                    className="w-full bg-slate-955/35 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="small">Small (11px)</option>
                    <option value="medium">Medium (13px)</option>
                    <option value="large">Large (15px)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-950/30 border border-slate-850 rounded-xl sm:col-span-2">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Compact Layout Mode</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Densely list incident tables to reduce page vertical margins.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                    <input 
                      type="checkbox" 
                      checked={compactMode} 
                      onChange={(e) => setCompactMode(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-slate-955 peer-checked:after:border-slate-955" />
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-950/30 border border-slate-850 rounded-xl sm:col-span-2">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Reduced Motion</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Deactivate structural visual transitions and diagnostic animations.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                    <input 
                      type="checkbox" 
                      checked={reducedMotion} 
                      onChange={(e) => setReducedMotion(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-slate-955 peer-checked:after:border-slate-955" />
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button 
                  onClick={() => handleSave('appearance')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-955 text-xs px-6 py-2.5 font-bold shadow rounded-xl active:scale-[0.98]"
                >
                  Save Style Parameters
                </Button>
              </div>
            </div>
          )}

          {/* CATEGORY 5: PRIVACY & SECURITY */}
          {activeCategory === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-white">Privacy & Security</h3>
                <p className="text-[11px] text-slate-450 mt-0.5">Manage session authorization parameters, data exports, and token structures.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Password Last Changed</span>
                    <span className="font-extrabold text-slate-300 mt-1 block">34 days ago</span>
                  </div>
                  <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Last Login Location</span>
                    <span className="font-extrabold text-slate-300 mt-1 block">Portland, OR (Chrome / Win10)</span>
                  </div>
                </div>

                <div className="border-t border-slate-850 pt-5 space-y-3.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Authorized Sessions</h4>
                  
                  <div className="space-y-2">
                    <div className="p-3 bg-slate-950/20 border border-slate-850 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="block font-bold text-slate-200">Chrome Browser on Windows Desktop</span>
                        <span className="block text-[10px] text-slate-550 mt-0.5">IP: 198.162.1.84 • Active Session</span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded text-[9px] font-bold uppercase">
                        Current Device
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950/20 border border-slate-850 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="block font-bold text-slate-300">Safari on Apple iPhone 15</span>
                        <span className="block text-[10px] text-slate-550 mt-0.5">IP: 74.125.19.14 • Last Active 2 hours ago</span>
                      </div>
                      <button 
                        onClick={() => toast('Revoked mobile terminal session.', 'success')}
                        className="text-[9px] font-black text-rose-500 hover:text-rose-400 hover:underline uppercase tracking-wider"
                      >
                        Revoke Access
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-3 flex-wrap">
                    <Button 
                      onClick={() => toast('Signout request sent for all secondary devices.', 'success')}
                      variant="outline"
                      className="text-xs font-bold py-2 border-slate-800 text-slate-350 hover:bg-slate-850 rounded-xl flex items-center gap-1.5"
                    >
                      <LogOut size={13} />
                      Sign Out of Other Devices
                    </Button>

                    <Button 
                      onClick={() => toast('Data export bundle initialized. We will email the links shortly.', 'success')}
                      variant="outline"
                      className="text-xs font-bold py-2 border-slate-800 text-slate-350 hover:bg-slate-850 rounded-xl flex items-center gap-1.5"
                    >
                      <Download size={13} />
                      Download My Data
                    </Button>
                  </div>
                </div>

                <div className="border-t border-slate-850 pt-5 space-y-3">
                  <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wider">Danger Zone</h4>
                  <div className="p-4 bg-rose-950/10 border border-rose-900/40 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Initiate Password Modification</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5 max-w-sm">Requires verification link sent to your primary registered email address.</span>
                    </div>
                    <Button 
                      onClick={() => toast('Password modification link dispatched to email.', 'success')}
                      className="bg-rose-600 hover:bg-rose-500 text-white text-xs px-4 py-2 font-bold rounded-xl shrink-0 flex items-center gap-1.5 active:scale-[0.98]"
                    >
                      <Lock size={13} />
                      Change Password
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY 6: ACCESSIBILITY */}
          {activeCategory === 'accessibility' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-white">Accessibility Features</h3>
                <p className="text-[11px] text-slate-450 mt-0.5">Adjust optimization preferences to match physical or screen reader constraints.</p>
              </div>

              <div className="space-y-3.5">
                {[
                  { id: 'contrast', label: 'High Contrast Mode', desc: 'Increases textual readability contrasts against slate backdrops.', state: highContrast, set: setHighContrast },
                  { id: 'largeTxt', label: 'Larger Text', desc: 'Increases standard paragraph scale settings for viewing logs.', state: largerText, set: setLargerText },
                  { id: 'keyNav', label: 'Keyboard Navigation focus', desc: 'Optimizes tabs order indexes for visual-free key operations.', state: keyboardNav, set: setKeyboardNav },
                  { id: 'screen', label: 'Screen Reader Optimizations', desc: 'Appends ARIA attributes dynamically to complex statistics boards.', state: screenReader, set: setScreenReader },
                  { id: 'anim', label: 'Reduced Animations', desc: 'Deactivates background pulses and dynamic slide overlays.', state: reducedAnimations, set: setReducedAnimations }
                ].map((accItem) => (
                  <div key={accItem.id} className="flex items-start justify-between gap-4 p-3 bg-slate-950/30 border border-slate-850/60 rounded-xl">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-200 block">{accItem.label}</span>
                      <span className="text-[10px] text-slate-500 block leading-normal">{accItem.desc}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                      <input 
                        type="checkbox" 
                        checked={accItem.state} 
                        onChange={(e) => accItem.set(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-slate-955 peer-checked:after:border-slate-955" />
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <Button 
                  onClick={() => handleSave('accessibility')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-955 text-xs px-6 py-2.5 font-bold shadow rounded-xl active:scale-[0.98]"
                >
                  Save Accessibility Settings
                </Button>
              </div>
            </div>
          )}

          {/* CATEGORY 7: PREFERENCES */}
          {activeCategory === 'preferences' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-white">System Preferences</h3>
                <p className="text-[11px] text-slate-450 mt-0.5">Configure timezone offsets, measuring units, and map diagnostics.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Language Dialect</label>
                  <select
                    value={prefLang}
                    onChange={(e) => setPrefLang(e.target.value)}
                    className="w-full bg-slate-955/35 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="English (US)">English (US)</option>
                    <option value="Español">Español</option>
                    <option value="Deutsch">Deutsch</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Time Zone</label>
                  <select
                    value={prefTimezone}
                    onChange={(e) => setPrefTimezone(e.target.value)}
                    className="w-full bg-slate-955/35 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="GMT-08:00 (Pacific Time)">GMT-08:00 (Pacific Time)</option>
                    <option value="GMT-05:00 (Eastern Time)">GMT-05:00 (Eastern Time)</option>
                    <option value="GMT+00:00 (Coordinated Universal Time)">GMT+00:00 (UTC)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date Format</label>
                  <select
                    value={prefDateFormat}
                    onChange={(e) => setPrefDateFormat(e.target.value)}
                    className="w-full bg-slate-955/35 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2026)</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2026-12-31)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Distance Units</label>
                  <select
                    value={prefDistance}
                    onChange={(e) => setPrefDistance(e.target.value)}
                    className="w-full bg-slate-955/35 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="Miles">Miles (imperial)</option>
                    <option value="Kilometers">Kilometers (metric)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Temperature Units</label>
                  <select
                    value={prefTemp}
                    onChange={(e) => setPrefTemp(e.target.value)}
                    className="w-full bg-slate-955/35 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="Fahrenheit">Fahrenheit (°F)</option>
                    <option value="Celsius">Celsius (°C)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Default Map Layer</label>
                  <select
                    value={prefMap}
                    onChange={(e) => setPrefMap(e.target.value)}
                    className="w-full bg-slate-955/35 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="Satellite">Satellitevision imagery</option>
                    <option value="Vector Street">Vector standard streets</option>
                    <option value="Dark Hybrid">Dark styled hybrid</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button 
                  onClick={() => handleSave('preferences')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-955 text-xs px-6 py-2.5 font-bold shadow rounded-xl active:scale-[0.98]"
                >
                  Save System Preferences
                </Button>
              </div>
            </div>
          )}

          {/* CATEGORY 8: ABOUT */}
          {activeCategory === 'about' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-white">About CivicLens AI</h3>
                <p className="text-[11px] text-slate-450 mt-0.5">Software parameters, operational licenses, and support channels.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-400">
                <div className="p-4 bg-slate-955/40 border border-slate-850 rounded-xl space-y-1">
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">Application Version</span>
                  <span className="text-white font-extrabold text-xs block">v1.4.0-release</span>
                </div>

                <div className="p-4 bg-slate-955/40 border border-slate-850 rounded-xl space-y-1">
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">Build Number</span>
                  <span className="text-white font-extrabold text-xs block">build-2026.06.30.0954</span>
                </div>
              </div>

              <div className="border-t border-slate-850 pt-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resources & Support</h4>
                
                <div className="flex flex-col gap-2 font-bold text-xs text-slate-350">
                  <button 
                    onClick={() => toast('Privacy Agreement loaded.', 'success')}
                    className="flex justify-between items-center p-3 bg-slate-950/20 border border-slate-850/60 rounded-xl hover:bg-slate-900/30 transition-colors w-full text-left"
                  >
                    <span>Read Privacy Policy Agreement</span>
                    <ChevronRight size={14} className="text-slate-500" />
                  </button>

                  <button 
                    onClick={() => toast('Terms of Service Agreement loaded.', 'success')}
                    className="flex justify-between items-center p-3 bg-slate-950/20 border border-slate-850/60 rounded-xl hover:bg-slate-900/30 transition-colors w-full text-left"
                  >
                    <span>Read Terms of Service Agreement</span>
                    <ChevronRight size={14} className="text-slate-500" />
                  </button>

                  <button 
                    onClick={() => toast('Licenses catalog loaded.', 'success')}
                    className="flex justify-between items-center p-3 bg-slate-950/20 border border-slate-850/60 rounded-xl hover:bg-slate-900/30 transition-colors w-full text-left"
                  >
                    <span>Open Source Licenses catalog</span>
                    <ChevronRight size={14} className="text-slate-500" />
                  </button>

                  <button 
                    onClick={() => navigate('/track')}
                    className="flex justify-between items-center p-3 bg-slate-950/20 border border-slate-850/60 rounded-xl hover:bg-slate-900/30 transition-colors w-full text-left"
                  >
                    <span>Contact Operations Support Desk</span>
                    <ChevronRight size={14} className="text-slate-500" />
                  </button>

                  <a 
                    href="https://github.com" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex justify-between items-center p-3 bg-slate-950/20 border border-slate-850/60 rounded-xl hover:bg-slate-900/30 transition-colors w-full text-left text-slate-350"
                  >
                    <span>Official GitHub Repository</span>
                    <ChevronRight size={14} className="text-slate-500" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY 9: DEVELOPER / ADMIN SETTINGS */}
          {activeCategory === 'developer' && isUserAdmin && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-white">Developer Configurations</h3>
                <p className="text-[11px] text-slate-450 mt-0.5">Role-aware configurations for large language models and database streams.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AI Model ModelName</label>
                  <select
                    value={adminModel}
                    onChange={(e) => setAdminModel(e.target.value)}
                    className="w-full bg-slate-955/35 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Default)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <label className="text-slate-400 uppercase tracking-wider">Temperature ({adminTemp})</label>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.1"
                    className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    value={adminTemp}
                    onChange={(e) => setAdminTemp(parseFloat(e.target.value))}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Firestore Credentials File Path</label>
                  <input
                    type="text"
                    value={firebasePath}
                    onChange={(e) => setFirebasePath(e.target.value)}
                    className="w-full bg-slate-955/35 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500/50"
                  />
                  <span className="text-[9px] text-slate-500 block mt-1">
                    Default context classpath loader: firebase-service-account.json
                  </span>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Console Logging Verbosity</label>
                  <select
                    value={logVerbosity}
                    onChange={(e) => setLogVerbosity(e.target.value)}
                    className="w-full bg-slate-955/35 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="INFO">INFO (Minimal console noise)</option>
                    <option value="DEBUG">DEBUG (Detailed AI grounding context logs)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button 
                  onClick={() => handleSave('developer')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-955 text-xs px-6 py-2.5 font-bold shadow rounded-xl active:scale-[0.98]"
                >
                  Save Model Settings
                </Button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
