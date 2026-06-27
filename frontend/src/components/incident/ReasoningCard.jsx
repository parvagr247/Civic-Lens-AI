import React from 'react';
import { AlertTriangle, ShieldAlert, HeartHandshake, Eye, Info } from 'lucide-react';

/**
 * ReasoningCard component.
 * Displays AI justifications, potential escalation hazards, and impact factors.
 */
export default function ReasoningCard({ risk }) {
  if (!risk) return null;

  const impacts = [
    { id: 'safety', label: 'Public Safety Impact', val: risk.publicSafetyImpact, icon: ShieldAlert, color: 'text-rose-400 border-rose-900/40 bg-rose-950/10' },
    { id: 'infra', label: 'Infrastructure Impact', val: risk.infrastructureImpact, icon: AlertTriangle, color: 'text-amber-400 border-amber-900/40 bg-amber-950/10' },
    { id: 'env', label: 'Environmental Impact', val: risk.environmentalImpact, icon: Eye, color: 'text-emerald-400 border-emerald-900/40 bg-emerald-950/10' },
    { id: 'access', label: 'Accessibility Impact', val: risk.accessibilityImpact, icon: HeartHandshake, color: 'text-blue-400 border-blue-900/40 bg-blue-950/10' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Executive Reasoning */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800 pb-2">
          <Info size={14} className="text-emerald-400" />
          AI Diagnostic Justification
        </h4>
        <p className="text-slate-300 text-sm leading-relaxed">
          {risk.reasoning}
        </p>
      </div>

      {/* Impact Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {impacts.map(imp => (
          <div key={imp.id} className={`border rounded-xl p-4 flex gap-3 ${imp.color}`}>
            <div className="shrink-0 mt-0.5">
              <imp.icon size={18} />
            </div>
            <div className="space-y-1">
              <h5 className="text-xs font-bold uppercase tracking-wider">{imp.label}</h5>
              <p className="text-xs opacity-90 leading-relaxed">{imp.val || 'No significant impact analyzed.'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Technical Escalation Warn Box */}
      {risk.potentialEscalation && (
        <div className="bg-rose-950/20 border border-rose-900/30 p-4 rounded-xl flex gap-3 animate-pulse">
          <div className="text-rose-400 shrink-0 mt-0.5">
            <AlertTriangle size={20} />
          </div>
          <div className="space-y-1">
            <h5 className="text-xs font-bold text-rose-300 uppercase tracking-wider">Potential Escalation Hazard</h5>
            <p className="text-rose-450 text-xs leading-relaxed">
              {risk.potentialEscalation}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
