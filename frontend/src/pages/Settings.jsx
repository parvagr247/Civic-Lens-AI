import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/ToastProvider';
import { getCurrentUser, isAdmin } from '../services/authService';
import { 
  Sparkles, Database, Server, Shield, User, Bell, 
  Lock, Laptop, Languages, EyeOff, Globe 
} from 'lucide-react';

/**
 * Settings component.
 * Role-aware Settings pane. Citizen controls are separated from Admin System parameters.
 */
export default function Settings() {
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  const isUserAdmin = isAdmin();

  // Tab State: 'citizen' or 'admin'
  const [activeTab, setActiveTab] = useState('citizen');

  // Citizen Settings States
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [lang, setLang] = useState('en');
  const [notifs, setNotifs] = useState(true);

  // Admin Settings States
  const [model, setModel] = useState('gemini-2.5-flash');
  const [temp, setTemp] = useState(0.2);
  const [firebasePath, setFirebasePath] = useState('classpath:firebase-service-account.json');

  const handleSave = () => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    window.dispatchEvent(new Event('themeChange'));
    toast('Settings updated successfully!', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 text-slate-900 dark:text-slate-100 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader 
          title="Settings & Configurations" 
          subtitle="Manage your profile settings, preferences, and system model configurations."
        />
        
        {/* Role-based Tab Selectors */}
        {isUserAdmin && (
          <div className="flex bg-slate-100 dark:bg-slate-950/60 p-1 rounded-xl border border-slate-200 dark:border-slate-850 shrink-0">
            <button
              onClick={() => setActiveTab('citizen')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'citizen' 
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              Citizen Preferences
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'admin' 
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              Admin Systems
            </button>
          </div>
        )}
      </div>

      {/* Tab Content: Citizen Settings */}
      {activeTab === 'citizen' && (
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Profile Card */}
          <Card className="p-5 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-slate-550 dark:text-slate-450 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-2">
              <User size={14} className="text-emerald-500" />
              Citizen Profile
            </h4>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-850">
                <span className="text-[9px] text-slate-400 block font-bold">Email address</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{currentUser?.email || 'N/A'}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-850">
                <span className="text-[9px] text-slate-400 block font-bold">Access Role</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block uppercase">{currentUser?.role || 'CITIZEN'}</span>
              </div>
            </div>
          </Card>

          {/* Theme & Display */}
          <Card className="p-5 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-slate-550 dark:text-slate-455 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-2">
              <Laptop size={14} className="text-emerald-500" />
              Theme & Accessibility
            </h4>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Visual Theme</label>
                <select 
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="light">Light contrast theme</option>
                  <option value="dark">Sleek dark mode theme</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">System Language</label>
                <select 
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="en">English (US)</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Notifications Card */}
          <Card className="p-5 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-slate-550 dark:text-slate-455 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-2">
              <Bell size={14} className="text-emerald-500" />
              Alert Notifications
            </h4>
            <div className="flex items-center justify-between py-1">
              <div>
                <span className="text-xs font-bold block">Push Notifications</span>
                <span className="text-[10px] text-slate-450 block">Alert when incident gets re-assigned or resolved.</span>
              </div>
              <input 
                type="checkbox"
                checked={notifs}
                onChange={(e) => setNotifs(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500" 
              />
            </div>
          </Card>

          {/* Security & Password */}
          <Card className="p-5 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-slate-550 dark:text-slate-455 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-2">
              <Lock size={14} className="text-emerald-500" />
              Security Settings
            </h4>
            <div className="text-[10px] text-slate-500 leading-normal">
              Credential changes and JWT session expirations are managed securely by the Municipal identity server. Click below to initiate password resets.
            </div>
            <Button variant="outline" className="w-full text-xs font-bold py-2 rounded-xl">
              Trigger Password Reset
            </Button>
          </Card>
        </div>
      )}

      {/* Tab Content: Admin Settings */}
      {activeTab === 'admin' && isUserAdmin && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Model settings */}
          <Card className="p-5 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-slate-550 dark:text-slate-455 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-2">
              <Sparkles size={14} className="text-emerald-500" />
              Gemini model parameters
            </h4>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">AI Model ModelName</label>
                <select 
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Default)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <label className="text-slate-500 uppercase tracking-wider">Temperature ({temp})</label>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.0"
                  step="0.1"
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  value={temp}
                  onChange={(e) => setTemp(parseFloat(e.target.value))}
                />
              </div>
            </div>
          </Card>

          {/* Firebase credentials */}
          <Card className="p-5 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-slate-550 dark:text-slate-455 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-2">
              <Database size={14} className="text-emerald-500" />
              Firestore connection parameters
            </h4>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Credentials File Path</label>
              <input
                type="text"
                value={firebasePath}
                onChange={(e) => setFirebasePath(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
              <span className="text-[9px] text-slate-450 block mt-1">
                Default context classpath loader: firebase-service-account.json
              </span>
            </div>
          </Card>

          {/* Log level configurations */}
          <Card className="p-5 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-slate-550 dark:text-slate-455 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-2">
              <Server size={14} className="text-emerald-500" />
              Console logs verbosity
            </h4>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Console Logging Verbose</label>
              <select className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none">
                <option value="INFO">INFO (Minimal console noise)</option>
                <option value="DEBUG">DEBUG (Detailed AI grounding context logs)</option>
              </select>
            </div>
          </Card>

          {/* Security Keys */}
          <Card className="p-5 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-slate-550 dark:text-slate-455 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-2">
              <Shield size={14} className="text-emerald-500" />
              JWT Security Configuration
            </h4>
            <div className="text-[10px] text-slate-500 leading-normal">
              Internal Bearer JWT Filters are active in the Spring Security filter chain. Token secrets are read from systemic JVM parameters to protect against leaks.
            </div>
          </Card>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2 rounded-xl shadow active:scale-95">
          Save Settings
        </Button>
      </div>

    </div>
  );
}
