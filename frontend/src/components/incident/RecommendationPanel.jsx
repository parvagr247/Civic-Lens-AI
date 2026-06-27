import React from 'react';
import { Wrench, CheckSquare } from 'lucide-react';

/**
 * RecommendationPanel component.
 * Lists the dispatcher guidelines and recommendations in checkbox forms.
 */
export default function RecommendationPanel({ recommendations }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800 pb-2">
        <Wrench size={14} className="text-emerald-400" />
        Dispatch Action Orders
      </h4>

      <div className="space-y-2">
        {recommendations.map((rec, idx) => (
          <div 
            key={idx} 
            className="flex items-start gap-3 p-3 bg-slate-950/20 border border-slate-850 rounded-lg hover:border-slate-800 transition-colors duration-200"
          >
            <CheckSquare size={16} className="text-emerald-400 mt-0.5 shrink-0" />
            <span className="text-xs text-slate-350 leading-relaxed">
              {rec}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
