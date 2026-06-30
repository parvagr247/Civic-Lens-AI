import React from 'react';

/**
 * RiskMeter component.
 * Renders an animated SVG circular gauge mapping risk scores to color zones.
 */
export default function RiskMeter({ score }) {
  // Ensure score is clamped between 0 and 100
  const normalizedScore = Math.min(Math.max(score || 0, 0), 100);

  // SVG parameters
  const radius = 60;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  // Calculate offset to draw representing percentage
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  // Determine color matching risk score
  const getRiskColor = (val) => {
    if (val <= 30) {
      return {
        text: 'text-emerald-600 dark:text-emerald-400',
        stroke: 'stroke-emerald-500',
        bg: 'bg-emerald-50/50 dark:bg-emerald-950/10',
        border: 'border-emerald-100 dark:border-emerald-900/50',
        label: 'Low Risk',
        labelBg: 'bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-250 dark:border-emerald-900/50'
      };
    }
    if (val <= 60) {
      return {
        text: 'text-amber-600 dark:text-amber-400',
        stroke: 'stroke-amber-500',
        bg: 'bg-amber-50/50 dark:bg-amber-950/10',
        border: 'border-amber-100 dark:border-amber-900/50',
        label: 'Medium Risk',
        labelBg: 'bg-amber-100/60 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-250 dark:border-amber-900/50'
      };
    }
    if (val <= 80) {
      return {
        text: 'text-orange-650 dark:text-orange-400',
        stroke: 'stroke-orange-500',
        bg: 'bg-orange-50/50 dark:bg-orange-950/10',
        border: 'border-orange-100 dark:border-orange-900/50',
        label: 'High Risk',
        labelBg: 'bg-orange-100/60 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-250 dark:border-orange-900/50'
      };
    }
    return {
      text: 'text-rose-650 dark:text-rose-450',
      stroke: 'stroke-rose-500',
      bg: 'bg-rose-50/50 dark:bg-rose-950/10',
      border: 'border-rose-100 dark:border-rose-900/50',
      label: 'Critical Risk',
      labelBg: 'bg-rose-100/60 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-250 dark:border-rose-900/50'
    };
  };

  const theme = getRiskColor(normalizedScore);

  return (
    <div className={`flex flex-col items-center justify-center p-6 border rounded-2xl ${theme.bg} ${theme.border} transition-all duration-300 w-full max-w-[240px]`}>
      
      {/* SVG Circle Gauge */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg className="w-full h-full rotate-[-90deg]">
          {/* Background circle track */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            className="stroke-slate-200 dark:stroke-slate-800 fill-none"
            strokeWidth={strokeWidth}
          />
          {/* Active progress circle */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            className={`fill-none transition-all duration-1000 ease-out ${theme.stroke}`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Text values inside gauge */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-black tracking-tight text-slate-850 dark:text-white leading-none">
            {normalizedScore}
          </span>
          <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest mt-1">
            Risk Index
          </span>
        </div>
      </div>

      {/* Label Badge */}
      <div className={`mt-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${theme.labelBg}`}>
        {theme.label}
      </div>

    </div>
  );
}

