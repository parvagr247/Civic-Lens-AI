import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const GlobalLayout = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-x-hidden transition-colors duration-300">
      {/* Background ambient light effects */}
      <div className="ambient-dot bg-primary w-[350px] h-[350px] top-[-50px] right-[-50px] opacity-10 blur-[90px]" />
      <div className="ambient-dot bg-blue-500 w-[400px] h-[400px] bottom-[-100px] left-[-100px] opacity-10 blur-[100px]" />

      <Navbar />

      <div className="flex flex-1 relative z-10">
        <Sidebar />

        {/* Page Content canvas */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default GlobalLayout;
