import React from 'react';
import { Clock } from 'lucide-react';

/**
 * UrgencyBadge component.
 * Displays color-coded badges based on the incident's response urgency level.
 */
export default function UrgencyBadge({ urgency }) {
  const getStyles = (level) => {
    switch (level?.toUpperCase()) {
      case 'IMMEDIATE':
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-455 border-rose-200 dark:border-rose-900/60';
      case 'WITHIN_24_HOURS':
        return 'bg-orange-50 dark:bg-orange-950/40 text-orange-650 dark:text-orange-400 border-orange-200 dark:border-orange-900/60';
      case 'WITHIN_3_DAYS':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/60';
      case 'WITHIN_1_WEEK':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/60';
      case 'ROUTINE':
      default:
        return 'bg-slate-55 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800';
    }
  };


  const formatText = (text) => {
    if (!text) return 'Routine';
    return text.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStyles(urgency)}`}>
      <Clock size={12} />
      {formatText(urgency)}
    </span>
  );
}
