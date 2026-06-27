import React, { useEffect, useState } from 'react';
import { Sun, Moon, Server, Database, Brain, Activity } from 'lucide-react';
import api from '../../services/api';

const Navbar = () => {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' ||
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  const [health, setHealth] = useState({
    backend: 'PENDING',
    firestore: 'PENDING',
    gemini: 'PENDING',
  });

  // Toggles the dark mode theme on the root DOM element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Query Backend Health details periodically
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await api.get('/api/health');
        if (response?.success && response?.data) {
          setHealth({
            backend: response.data.backend || 'UP',
            firestore: response.data.firestore || 'UP',
            gemini: response.data.gemini || 'UP',
          });
        }
      } catch (error) {
        console.error('Navbar Health Check failed:', error);
        setHealth({
          backend: 'DOWN',
          firestore: 'DOWN',
          gemini: 'DOWN',
        });
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    if (status === 'UP') return 'bg-emerald-500 text-emerald-100 border-emerald-600/30';
    if (status === 'PENDING') return 'bg-amber-500/20 text-amber-500 border-amber-500/30 animate-pulse';
    return 'bg-red-500/20 text-red-500 border-red-500/30';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/85 backdrop-blur-md transition-all duration-300">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Activity className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
            CivicLens AI
          </span>
        </div>

        {/* Health Indicators & Utilities */}
        <div className="flex items-center gap-4">
          {/* Health Badges */}
          <div className="hidden md:flex items-center gap-3 text-xs">
            {/* Backend status badge */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${getStatusColor(health.backend)}`}>
              <Server className="w-3.5 h-3.5" />
              <span>API: {health.backend}</span>
            </div>

            {/* Firestore status badge */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${getStatusColor(health.firestore)}`}>
              <Database className="w-3.5 h-3.5" />
              <span>DB: {health.firestore}</span>
            </div>

            {/* Gemini status badge */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${getStatusColor(health.gemini)}`}>
              <Brain className="w-3.5 h-3.5" />
              <span>AI: {health.gemini}</span>
            </div>
          </div>

          {/* Theme Switcher */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Dummy User profile */}
          <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-semibold text-muted-foreground">
            AD
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
