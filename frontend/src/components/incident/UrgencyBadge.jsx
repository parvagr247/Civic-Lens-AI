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
        return 'bg-rose-950/40 text-rose-400 border-rose-900/60';
      case 'WITHIN_24_HOURS':
        return 'bg-orange-950/40 text-orange-400 border-orange-900/60';
      case 'WITHIN_3_DAYS':
        return 'bg-amber-950/40 text-amber-400 border-amber-900/60';
      case 'WITHIN_1_WEEK':
        return 'bg-blue-950/40 text-blue-400 border-blue-900/60';
      case 'ROUTINE':
      default:
        return 'bg-slate-900/60 text-slate-400 border-slate-800';
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
