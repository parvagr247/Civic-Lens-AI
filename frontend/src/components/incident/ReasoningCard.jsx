import React from 'react';
import { AlertTriangle, ShieldAlert, HeartHandshake, Eye, Info } from 'lucide-react';
import '../../styles/dashboard/RiskDashboard.css';

/**
 * ReasoningCard component.
 * Displays AI justifications, potential escalation hazards, and impact factors.
 */
export default function ReasoningCard({ risk }) {
  if (!risk) return null;

  const impacts = [
    { id: 'safety', label: 'Public Safety Impact', val: risk.publicSafetyImpact, icon: ShieldAlert, color: 'impact-safety-card' },
    { id: 'infra', label: 'Infrastructure Impact', val: risk.infrastructureImpact, icon: AlertTriangle, color: 'impact-infra-card' },
    { id: 'env', label: 'Environmental Impact', val: risk.environmentalImpact, icon: Eye, color: 'impact-env-card' },
    { id: 'access', label: 'Accessibility Impact', val: risk.accessibilityImpact, icon: HeartHandshake, color: 'impact-access-card' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Executive Reasoning */}
      <div className="risk-card rounded-xl p-5 shadow-lg space-y-3">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 border-b border-border pb-2">
          <Info size={14} className="text-emerald-500" />
          AI Diagnostic Justification
        </h4>
        <p className="text-foreground text-sm leading-relaxed">
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
        <div className="escalation-hazard-card border p-4 rounded-xl flex gap-3 animate-pulse">
          <div className="shrink-0 mt-0.5">
            <AlertTriangle size={20} />
          </div>
          <div className="space-y-1">
            <h5 className="text-xs font-bold uppercase tracking-wider">Potential Escalation Hazard</h5>
            <p className="text-xs leading-relaxed">
              {risk.potentialEscalation}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
