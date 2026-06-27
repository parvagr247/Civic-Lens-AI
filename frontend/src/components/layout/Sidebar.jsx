import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileUp, TrendingUp, Bot, Settings } from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Analyze Issue', path: '/analyze', icon: FileUp },
    { name: 'City Intelligence', path: '/intelligence', icon: TrendingUp },
    { name: 'AI Copilot', path: '/copilot', icon: Bot },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card flex-shrink-0 hidden md:block">
      <nav className="flex flex-col gap-1.5 p-4 h-[calc(100vh-4rem)]">
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Municipal Operations
        </div>
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
