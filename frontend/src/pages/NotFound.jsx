import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden transition-colors duration-200">
      {/* Premium blur spot gradients */}
      <div className="absolute top-1/4 left-1/3 w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[350px] h-[350px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="space-y-6 max-w-md w-full bg-white/70 dark:bg-slate-900/30 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-slate-200/50 dark:border-slate-700/50 shadow-sm animate-pulse">
          <HelpCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
            404
          </h1>
          <h2 className="text-base font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Page Not Found
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-4">
            The requested page does not exist or has been moved. Verify the URL or return to the main dashboard.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <Button 
            onClick={() => navigate('/')} 
            variant="primary" 
            icon={ArrowLeft}
            className="px-6 py-2.5 rounded-xl text-xs font-black shadow-sm transition duration-150"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
