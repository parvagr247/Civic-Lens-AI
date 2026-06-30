import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

/**
 * ConfidenceIndicator component.
 * Renders the AI confidence level with a progress track and descriptive helper texts.
 */
export default function ConfidenceIndicator({ confidence }) {
  const percent = Math.round(confidence * 100);
  
  const getStyles = (val) => {
    if (val >= 85) return { text: 'text-emerald-600 dark:text-emerald-400', progress: 'bg-emerald-500', label: 'High Confidence' };
    if (val >= 60) return { text: 'text-amber-600 dark:text-amber-400', progress: 'bg-amber-500', label: 'Moderate Confidence' };
    return { text: 'text-rose-650 dark:text-rose-400', progress: 'bg-rose-500', label: 'Low Confidence' };
  };

  const meta = getStyles(percent);

  return (
    <div className="space-y-2 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-855 p-4 rounded-xl">
      <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          {percent >= 60 ? (
            <ShieldCheck size={14} className="text-emerald-500" />
          ) : (
            <AlertTriangle size={14} className="text-rose-500" />
          )}
          Reliability Meter
        </span>
        <span className={`font-black ${meta.text}`}>{percent}%</span>
      </div>

      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${meta.progress}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="text-[10px] text-slate-600 dark:text-slate-500 mt-1 leading-normal">
        {meta.label}. Model processed verified image details, coordinates, and categories under smart city parameters.
      </p>
    </div>
  );
}
