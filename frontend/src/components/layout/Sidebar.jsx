import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileUp, 
  TrendingUp, 
  Bot, 
  Settings, 
  ShieldAlert, 
  LogOut, 
  Users, 
  ChevronDown, 
  ChevronRight,
  ShieldAlert as ShieldIcon
} from 'lucide-react';
import { getCurrentUser, isAdmin, isOfficer, logout } from '../../services/authService';
import '../../styles/layout/Sidebar.css';

/**
 * Sidebar navigation component.
 * Features Collapsible groups, sticky page viewports, and role-based links.
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

  const handleLogout = async () => {
    // Triggers confirmation inside header or directly logout for simplicity
    await logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 border-r border-slate-800 bg-[#070b19]/40 flex-shrink-0 hidden md:flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      <nav className="flex flex-col gap-3 p-4">
        
        {/* GROUP 1: Citizen Workspace */}
        {user && !isUserAdmin && !isUserOfficer && (
          <div className="space-y-1">
            <button 
              onClick={() => setOpenCitizen(!openCitizen)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-350 transition-colors"
            >
              <span>Citizen Workspace</span>
              {openCitizen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>

            {openCitizen && (
              <div className="space-y-1 pl-1">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
                      isActive ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10' : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                    }`
                  }
                >
                  <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                  <span>Dashboard</span>
                </NavLink>

                <NavLink
                  to="/analyze"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
                      isActive ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                    }`
                  }
                >
                  <FileUp className="w-3.5 h-3.5 shrink-0" />
                  <span>Report Issue</span>
                </NavLink>

                <NavLink
                  to="/feed"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
                      isActive ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                    }`
                  }
                >
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span>Community Feed</span>
                </NavLink>

                <NavLink
                  to="/intelligence"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
                      isActive ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                    }`
                  }
                >
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                  <span>City Intelligence</span>
                </NavLink>

                <NavLink
                  to="/risk-intelligence"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
                      isActive ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                    }`
                  }
                >
                  <ShieldIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>Risk Intelligence</span>
                </NavLink>

                <NavLink
                  to="/copilot"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
                      isActive ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                    }`
                  }
                >
                  <Bot className="w-3.5 h-3.5 shrink-0" />
                  <span>AI Copilot</span>
                </NavLink>
              </div>
            )}
          </div>
        )}

        {/* GROUP 2: Officer Console */}
        {user && isUserOfficer && (
          <div className="space-y-1">
            <button 
              onClick={() => setOpenOfficer(!openOfficer)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-350 transition-colors"
            >
              <span>Officer Console</span>
              {openOfficer ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>

            {openOfficer && (
              <div className="space-y-1 pl-1">
                <NavLink
                  to="/officer-dashboard"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
                      isActive ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                    }`
                  }
                >
                  <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                  <span>Officer Dashboard</span>
                </NavLink>

                <NavLink
                  to="/risk-intelligence"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
                      isActive ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                    }`
                  }
                >
                  <ShieldIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>Risk Intelligence</span>
                </NavLink>
              </div>
            )}
          </div>
        )}

        {/* GROUP 3: Admin Console */}
        {user && isUserAdmin && (
          <div className="space-y-1">
            <button 
              onClick={() => setOpenAdmin(!openAdmin)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-350 transition-colors"
            >
              <span>Municipal Console</span>
              {openAdmin ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>

            {openAdmin && (
              <div className="space-y-1 pl-1">
                <NavLink
                  to="/admin-dashboard"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
                      isActive ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                    }`
                  }
                >
                  <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                  <span>Admin Dashboard</span>
                </NavLink>

                <NavLink
                  to="/risk-intelligence"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
                      isActive ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                    }`
                  }
                >
                  <ShieldIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>Risk Intelligence</span>
                </NavLink>
              </div>
            )}
          </div>
        )}

      </nav>

      {/* Account Settings */}
      <div className="p-4 border-t border-slate-850 space-y-2 shrink-0">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              isActive ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
            }`
          }
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>Settings</span>
        </NavLink>
      </div>

    </aside>
  );
};

export default Sidebar;
