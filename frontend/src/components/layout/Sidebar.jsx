import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileUp, 
  TrendingUp, 
  Bot, 
  Settings, 
  LogOut, 
  Users, 
  User,
  ChevronDown, 
  ChevronRight,
  ChevronLeft,
  Shield,
  ShieldAlert,
  Menu,
  Trophy
} from 'lucide-react';
import { getCurrentUser, isAdmin, isOfficer, logout } from '../../services/authService';
import '../../styles/layout/Sidebar.css';

/**
 * Sidebar navigation component.
 * Features Collapsible groups, sticky page viewports, role-based links, and collapsed (icon-only) state.
 */
const Sidebar = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const isUserAdmin = isAdmin();
  const isUserOfficer = isOfficer();

  // Collapsible Group States
  const [openCitizen, setOpenCitizen] = useState(true);
  const [openOfficer, setOpenOfficer] = useState(true);
  const [openAdmin, setOpenAdmin] = useState(true);

  // Sidebar minimized state
  const [collapsed, setCollapsed] = useState(false);

  const getNavLinkClass = (isActive, isCollapsed) => {
    return `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
      isActive 
        ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-md shadow-emerald-500/10' 
        : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800/60 hover:text-gray-900 dark:hover:text-slate-200'
    } ${isCollapsed ? 'justify-center' : ''}`;
  };

  return (
    <aside 
      className={`border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-[#090d16]/80 flex-shrink-0 hidden md:flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <nav className="flex flex-col gap-3 p-3">
        
        {/* Collapse toggle row */}
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-200 dark:border-slate-800 shrink-0">
          {!collapsed && (
            <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
              Workspace
            </span>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 transition-colors mx-auto md:mx-0"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* GROUP 1: Citizen Workspace */}
        {user && !isUserAdmin && !isUserOfficer && (
          <div className="space-y-1">
            {!collapsed ? (
              <button 
                onClick={() => setOpenCitizen(!openCitizen)}
                className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest hover:text-gray-600 dark:hover:text-slate-350 transition-colors"
              >
                <span>Citizen Hub</span>
                {openCitizen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              </button>
            ) : (
              <div className="h-[1px] bg-gray-200 dark:bg-slate-800 my-2" />
            )}

            {(openCitizen || collapsed) && (
              <div className="space-y-1">
                <NavLink
                  to="/dashboard"
                  title="Dashboard"
                  className={({ isActive }) => getNavLinkClass(isActive, collapsed)}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Dashboard</span>}
                </NavLink>

                <NavLink
                  to={`/profile/${user?.userId}`}
                  title="My Profile"
                  className={({ isActive }) => getNavLinkClass(isActive, collapsed)}
                >
                  <User className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>My Profile</span>}
                </NavLink>

                <NavLink
                  to="/analyze"
                  title="Report Issue"
                  className={({ isActive }) => getNavLinkClass(isActive, collapsed)}
                >
                  <FileUp className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Report Issue</span>}
                </NavLink>

                <NavLink
                  to="/track"
                  title="Anonymous Tracking"
                  className={({ isActive }) => getNavLinkClass(isActive, collapsed)}
                >
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Anonymous Tracking</span>}
                </NavLink>

                <NavLink
                  to="/feed"
                  title="Community Feed"
                  className={({ isActive }) => getNavLinkClass(isActive, collapsed)}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Community Feed</span>}
                </NavLink>

                <NavLink
                  to="/leaderboard"
                  title="Leaderboard"
                  className={({ isActive }) => getNavLinkClass(isActive, collapsed)}
                >
                  <Trophy className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Leaderboard</span>}
                </NavLink>

                <NavLink
                  to="/intelligence"
                  title="City Intelligence"
                  className={({ isActive }) => getNavLinkClass(isActive, collapsed)}
                >
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>City Intelligence</span>}
                </NavLink>

                <NavLink
                  to="/risk-intelligence"
                  title="Risk Intelligence"
                  className={({ isActive }) => getNavLinkClass(isActive, collapsed)}
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Risk Intelligence</span>}
                </NavLink>
              </div>
            )}
          </div>
        )}

        {/* GROUP 2: Officer Console */}
        {user && isUserOfficer && (
          <div className="space-y-1">
            {!collapsed ? (
              <button 
                onClick={() => setOpenOfficer(!openOfficer)}
                className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest hover:text-gray-600 dark:hover:text-slate-350 transition-colors"
              >
                <span>Officer Console</span>
                {openOfficer ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              </button>
            ) : (
              <div className="h-[1px] bg-gray-200 dark:bg-slate-800 my-2" />
            )}

            {(openOfficer || collapsed) && (
              <div className="space-y-1">
                <NavLink
                  to="/officer-dashboard"
                  title="Officer Dashboard"
                  className={({ isActive }) => getNavLinkClass(isActive, collapsed)}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Officer Dashboard</span>}
                </NavLink>

                <NavLink
                  to="/risk-intelligence"
                  title="Risk Intelligence"
                  className={({ isActive }) => getNavLinkClass(isActive, collapsed)}
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Risk Intelligence</span>}
                </NavLink>

                <NavLink
                  to="/leaderboard"
                  title="Leaderboard"
                  className={({ isActive }) => getNavLinkClass(isActive, collapsed)}
                >
                  <Trophy className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Leaderboard</span>}
                </NavLink>
              </div>
            )}
          </div>
        )}

        {/* GROUP 3: Admin Console */}
        {user && isUserAdmin && (
          <div className="space-y-1">
            {!collapsed ? (
              <button 
                onClick={() => setOpenAdmin(!openAdmin)}
                className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest hover:text-gray-600 dark:hover:text-slate-350 transition-colors"
              >
                <span>Municipal Hub</span>
                {openAdmin ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              </button>
            ) : (
              <div className="h-[1px] bg-gray-200 dark:bg-slate-800 my-2" />
            )}

            {(openAdmin || collapsed) && (
              <div className="space-y-1">
                <NavLink
                  to="/admin-dashboard"
                  title="Admin Dashboard"
                  className={({ isActive }) => getNavLinkClass(isActive, collapsed)}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Admin Dashboard</span>}
                </NavLink>

                <NavLink
                  to="/departments"
                  title="Department Analytics"
                  className={({ isActive }) => getNavLinkClass(isActive, collapsed)}
                >
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Department Analytics</span>}
                </NavLink>

                <NavLink
                  to="/risk-intelligence"
                  title="Risk Intelligence"
                  className={({ isActive }) => getNavLinkClass(isActive, collapsed)}
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Risk Intelligence</span>}
                </NavLink>

                <NavLink
                  to="/ai-insights"
                  title="AI Insights"
                  className={({ isActive }) => getNavLinkClass(isActive, collapsed)}
                >
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>AI Insights</span>}
                </NavLink>

                <NavLink
                  to="/moderation"
                  title="Community Moderation"
                  className={({ isActive }) => getNavLinkClass(isActive, collapsed)}
                >
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Community Moderation</span>}
                </NavLink>

                <NavLink
                  to="/leaderboard"
                  title="Leaderboard"
                  className={({ isActive }) => getNavLinkClass(isActive, collapsed)}
                >
                  <Trophy className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Leaderboard</span>}
                </NavLink>
              </div>
            )}
          </div>
        )}

      </nav>

      {/* Account Settings */}
      <div className="p-3 border-t border-gray-200 dark:border-slate-800 space-y-2 shrink-0">
        <NavLink
          to="/settings"
          title="Settings"
          className={({ isActive }) => getNavLinkClass(isActive, collapsed)}
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
      </div>

    </aside>
  );
};

export default Sidebar;
