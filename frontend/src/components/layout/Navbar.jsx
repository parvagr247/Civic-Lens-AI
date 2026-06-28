import React, { useEffect, useState } from 'react';
import { Sun, Moon, Server, Database, Brain, Activity, Bell, User, LogOut, Bookmark, Shield, CheckCircle, X } from 'lucide-react';
import api from '../../services/api';
import { getNotifications, markAllAsRead, markAsRead, deleteNotification, deleteAllNotifications } from '../../services/notificationService';
import { getCurrentUser, logout } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useToast } from '../ui/ToastProvider';
import '../../styles/notification/Notifications.css';

const Navbar = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const { toast } = useToast();

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
  const [notificationFilter, setNotificationFilter] = useState('all');

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

  useEffect(() => {
    const handleThemeChange = () => {
      const currentTheme = localStorage.getItem('theme');
      setDarkMode(currentTheme === 'dark');
    };
    window.addEventListener('themeChange', handleThemeChange);
    window.addEventListener('storage', handleThemeChange);
    return () => {
      window.removeEventListener('themeChange', handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
    };
  }, []);

  // Health and Notification polling
  useEffect(() => {
    if (!currentUser) return; // Do not register intervals if not logged in

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

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      try {
        await markAsRead(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.warn(err);
      }
    }
    setShowNotifications(false);
    if (notif.referenceId) {
      navigate(`/incidents/${notif.referenceId}`);
    }
  };

  const handleSingleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      const isUnread = !notifications.find(n => n.id === id)?.read;
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (isUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await deleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.warn(err);
    }
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    await logout();
    toast('Session signed out successfully. Goodbye!', 'success');
    navigate('/login');
  };

  const getStatusColor = (status) => {
    if (status === 'UP') return 'bg-emerald-500 text-emerald-100 border-emerald-600/30';
    if (status === 'PENDING') return 'bg-amber-500/20 text-amber-500 border-amber-500/30 animate-pulse';
    return 'bg-red-500/20 text-red-500 border-red-500/30';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#070b19]/90 backdrop-blur-md transition-all duration-300">
      <div className="flex h-16 items-center justify-between px-6">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 shadow-md">
            <Activity className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-md tracking-wider text-slate-900 dark:text-white">
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
            className="p-2 rounded-lg text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-800 dark:hover:text-white transition-all duration-200"
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
                className={`p-2 rounded-lg text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-800 dark:hover:text-white transition-all duration-200 relative ${
                  showNotifications ? 'bg-slate-100 dark:bg-slate-850 text-slate-800 dark:text-white' : ''
                }`}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-slate-900 dark:border-slate-950 flex items-center justify-center text-[7px] text-white font-black" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xl z-50 w-80 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-850 pb-2 shrink-0">
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Inbox Notifications</span>
                    <div className="flex gap-2">
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllRead}
                          className="text-[9px] font-bold text-emerald-500 dark:text-emerald-400 hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button 
                          onClick={handleDeleteAll}
                          className="text-[9px] font-bold text-rose-500 dark:text-rose-455 hover:underline"
                        >
                          Delete all
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-1.5">
                    {['all', 'unread'].map(f => (
                      <button
                        key={f}
                        onClick={() => setNotificationFilter(f)}
                        className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all ${
                          notificationFilter === f
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2 text-[10px] scrollbar-thin pr-1">
                    {(notificationFilter === 'unread' ? notifications.filter(n => !n.read) : notifications).length === 0 ? (
                      <p className="text-center py-6 text-slate-450 dark:text-slate-550 font-medium">No notifications to display.</p>
                    ) : (
                      (notificationFilter === 'unread' ? notifications.filter(n => !n.read) : notifications).map(notif => (
                        <div 
                          key={notif.id} 
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-2 rounded-lg border transition-all cursor-pointer relative group ${
                            notif.read 
                              ? 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-150 dark:border-slate-850/40 text-slate-550 dark:text-slate-450' 
                              : 'bg-emerald-50/40 dark:bg-emerald-950/5 border-emerald-100/50 dark:border-emerald-950/20 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex justify-between font-bold pr-4">
                            <span className="text-slate-700 dark:text-slate-305 font-extrabold">{notif.senderName}</span>
                            <span className="text-[7px] text-slate-400 dark:text-slate-500 font-mono">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="mt-0.5 leading-normal pr-4 font-semibold text-slate-650 dark:text-slate-400">{notif.message}</p>
                          
                          <button
                            onClick={(e) => handleSingleDelete(e, notif.id)}
                            className="absolute top-1.5 right-1.5 p-1 rounded hover:bg-slate-250 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete"
                          >
                            <X size={10} />
                          </button>
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
                className={`flex items-center justify-center h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-emerald-500/50 transition-all duration-200 ${
                  showProfileMenu ? 'border-emerald-500/50' : ''
                }`}
              >
                {currentUser.name?.substring(0, 2).toUpperCase() || 'US'}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 shadow-2xl z-50 w-52 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-2.5 py-1 border-b border-slate-200 dark:border-slate-850 pb-2">
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{currentUser.name}</span>
                    <span className="block text-[9px] text-slate-450 dark:text-slate-500 truncate mt-0.5">{currentUser.email}</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                      className="flex items-center gap-2.5 p-2 text-xs font-semibold text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-white rounded-lg w-full text-left"
                    >
                      <User size={13} />
                      Edit Profile
                    </button>
                    <button 
                      onClick={() => { setShowProfileMenu(false); navigate('/risk-intelligence'); }}
                      className="flex items-center gap-2.5 p-2 text-xs font-semibold text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-white rounded-lg w-full text-left"
                    >
                      <Bookmark size={13} />
                      Saved Reports
                    </button>
                    <button 
                      onClick={() => { setShowProfileMenu(false); setShowLogoutModal(true); }}
                      className="flex items-center gap-2.5 p-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-700 dark:hover:text-rose-350 rounded-lg w-full text-left"
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
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center animate-scale-in">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Sign Out Confirmation</h3>
            <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-semibold">Are you sure you want to end your active session and sign out of CivicLens AI?</p>
            
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleLogoutConfirm}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs py-2 shadow-sm active:scale-95"
              >
                Sign Out
              </Button>
              <Button
                onClick={() => setShowLogoutModal(false)}
                variant="outline"
                className="flex-1 border-slate-200 hover:bg-slate-100 text-slate-700 dark:border-slate-800 dark:hover:bg-slate-850 dark:text-slate-300 font-bold text-xs py-2 active:scale-95 shadow-sm"
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
