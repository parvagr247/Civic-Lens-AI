import React from 'react';
import { ShieldAlert } from 'lucide-react';

/**
 * SeverityBadge component.
 * Displays color-coded badges based on the incident's risk severity level.
 */
export default function SeverityBadge({ severity }) {
  const getStyles = (level) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450 border-rose-200 dark:border-rose-900/60';
      case 'SEVERE':
        return 'bg-orange-50 dark:bg-orange-950/40 text-orange-650 dark:text-orange-400 border-orange-200 dark:border-orange-900/60';
      case 'MAJOR':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/60';
      case 'MODERATE':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/60';
      case 'MINOR':
      default:
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60';
    }
  };


  const formatText = (text) => {
    if (!text) return 'Unknown';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStyles(severity)}`}>
      <ShieldAlert size={12} />
      {formatText(severity)}
    </span>
  );
}
