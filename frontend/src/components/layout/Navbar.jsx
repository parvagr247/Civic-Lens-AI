import React, { useEffect, useState } from 'react';
import { Sun, Moon, Server, Database, Brain, Activity, Bell, User, LogOut, Bookmark, Shield, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { getNotifications, markAllAsRead } from '../../services/notificationService';
import { getCurrentUser, logout } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import '../../styles/notification/Notifications.css';

const Navbar = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' ||
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  const [health, setHealth] = useState({
    backend: 'PENDING',
    firestore: 'PENDING',
    gemini: 'PENDING',
  });

  // Notifications states
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Profile states
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Theme effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Health and Notification polling
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
        setHealth({ backend: 'DOWN', firestore: 'DOWN', gemini: 'DOWN' });
      }
    };

    const fetchNotifications = async () => {
      if (!currentUser) return;
      try {
        const res = await getNotifications();
        if (res.success && res.data) {
          setNotifications(res.data);
          const unread = res.data.filter(n => !n.read).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.warn('Failed to load notifications', err);
      }
    };

    fetchHealth();
    fetchNotifications();

    const healthInterval = setInterval(fetchHealth, 15000);
    const notifInterval = setInterval(fetchNotifications, 10000);

    return () => {
      clearInterval(healthInterval);
      clearInterval(notifInterval);
    };
  }, [currentUser?.userId]);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn(err);
    }
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    await logout();
    navigate('/login');
  };

  const getStatusColor = (status) => {
    if (status === 'UP') return 'bg-emerald-500 text-emerald-100 border-emerald-600/30';
    if (status === 'PENDING') return 'bg-amber-500/20 text-amber-500 border-amber-500/30 animate-pulse';
    return 'bg-red-500/20 text-red-500 border-red-500/30';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#070b19]/80 backdrop-blur-md transition-all duration-300">
      <div className="flex h-16 items-center justify-between px-6">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 shadow-md">
            <Activity className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-md tracking-wider text-white">
            CivicLens AI
          </span>
        </div>

        {/* Health Indicators & Utilities */}
        <div className="flex items-center gap-4">
          
          {/* Health Badges */}
          <div className="hidden md:flex items-center gap-3 text-[10px] font-bold">
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${getStatusColor(health.backend)}`}>
              <Server className="w-3 h-3" />
              <span>API: {health.backend}</span>
            </div>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${getStatusColor(health.firestore)}`}>
              <Database className="w-3 h-3" />
              <span>DB: {health.firestore}</span>
            </div>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${getStatusColor(health.gemini)}`}>
              <Brain className="w-3 h-3" />
              <span>AI: {health.gemini}</span>
            </div>
          </div>

          {/* Theme Switcher */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-slate-450 hover:bg-slate-850 hover:text-white transition-all duration-200"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications Bell (GitHub Style) */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                className={`p-2 rounded-lg text-slate-450 hover:bg-slate-850 hover:text-white transition-all duration-200 relative ${
                  showNotifications ? 'bg-slate-850 text-white' : ''
                }`}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-[7px] text-white font-black" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-2xl z-50 w-72 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-2 shrink-0">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Inbox Notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-[9px] font-bold text-emerald-400 hover:underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-2 text-[10px] scrollbar-thin">
                    {notifications.length === 0 ? (
                      <p className="text-center py-6 text-slate-500">Inbox is empty. You're all caught up!</p>
                    ) : (
                      notifications.slice(0, 5).map(notif => (
                        <div 
                          key={notif.id} 
                          className={`p-2 rounded-lg border transition-colors ${
                            notif.read ? 'bg-slate-950/20 border-slate-850/40 text-slate-450' : 'bg-emerald-950/5 border-emerald-950/30 text-slate-200'
                          }`}
                        >
                          <div className="flex justify-between font-bold">
                            <span className="text-slate-350">{notif.senderName}</span>
                            <span className="text-[7px] text-slate-500 font-mono">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="mt-0.5 leading-normal">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile Dropdown Menu */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className={`flex items-center justify-center h-8 w-8 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:border-emerald-500/50 transition-all duration-200 ${
                  showProfileMenu ? 'border-emerald-500/50' : ''
                }`}
              >
                {currentUser.name?.substring(0, 2).toUpperCase() || 'US'}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl p-2.5 shadow-2xl z-50 w-52 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-2.5 py-1 border-b border-slate-850 pb-2">
                    <span className="block text-xs font-bold text-slate-200 truncate">{currentUser.name}</span>
                    <span className="block text-[9px] text-slate-500 truncate mt-0.5">{currentUser.email}</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                      className="flex items-center gap-2.5 p-2 text-xs font-semibold text-slate-400 hover:bg-slate-850 hover:text-white rounded-lg w-full text-left"
                    >
                      <User size={13} />
                      Edit Profile
                    </button>
                    <button 
                      onClick={() => { setShowProfileMenu(false); navigate('/risk-intelligence'); }}
                      className="flex items-center gap-2.5 p-2 text-xs font-semibold text-slate-400 hover:bg-slate-850 hover:text-white rounded-lg w-full text-left"
                    >
                      <Bookmark size={13} />
                      Saved Reports
                    </button>
                    <button 
                      onClick={() => { setShowProfileMenu(false); setShowLogoutModal(true); }}
                      className="flex items-center gap-2.5 p-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/20 hover:text-rose-350 rounded-lg w-full text-left"
                    >
                      <LogOut size={13} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Logout confirmation overlay modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <h3 className="text-base font-black text-white">Sign Out Confirmation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Are you sure you want to end your active session and sign out of CivicLens AI?</p>
            
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleLogoutConfirm}
                className="flex-1 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl text-xs py-2"
              >
                Logout
              </Button>
              <Button
                onClick={() => setShowLogoutModal(false)}
                variant="outline"
                className="flex-1 border-slate-800 text-xs py-2 text-slate-400"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

    </header>
  );
};

export default Navbar;
