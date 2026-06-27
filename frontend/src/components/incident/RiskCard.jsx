import React, { useState } from 'react';
import { ShieldCheck, Users, Clock, Building, Sparkles, Loader2 } from 'lucide-react';
import RiskMeter from './RiskMeter';
import SeverityBadge from './SeverityBadge';
import UrgencyBadge from './UrgencyBadge';
import ConfidenceIndicator from './ConfidenceIndicator';
import { reanalyzeRisk } from '../../services/riskService';
import { Button } from '../ui/Button';

/**
 * RiskCard component.
 * Displays overall risk indicators, SLA details, and meta information.
 */
export default function RiskCard({ risk, onReanalyzeUpdate }) {
  const [reanalyzing, setReanalyzing] = useState(false);

  if (!risk) return null;

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      const response = await reanalyzeRisk(risk.incidentId);
      if (onReanalyzeUpdate) {
        onReanalyzeUpdate(response.data);
      }
    } catch (error) {
      console.error('Reanalysis failed', error);
      alert('Failed to re-run risk analysis: ' + (error.message || error));
    } finally {
      setReanalyzing(false);
    }
  };

  const formatEnum = (str) => {
    if (!str) return 'N/A';
    return str.replace(/_/g, ' ');
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      
      {/* Header and Re-Analyze Action */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 rounded-lg">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">Risk Assessment Card</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">SLA Dispatch Prioritization</p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReanalyze}
          disabled={reanalyzing}
          className="flex items-center gap-1.5 text-xs py-1.5 px-3 border-slate-700 hover:border-slate-650"
        >
          {reanalyzing ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Recalculating...
            </>
          ) : (
            <>
              <Sparkles size={12} className="text-emerald-400" />
              Re-Analyze
            </>
          )}
        </Button>
      </div>

      {/* Main Grid: Risk Meter vs Stats */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Left Dial */}
        <div className="md:col-span-5 flex justify-center">
          <RiskMeter score={risk.overallRiskScore} />
        </div>

        {/* Right Details Grid */}
        <div className="md:col-span-7 space-y-4">
          
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2.5">
            <div className="space-y-1">
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Severity</span>
              <SeverityBadge severity={risk.severity} />
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Urgency</span>
              <UrgencyBadge urgency={risk.urgency} />
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">SLA Priority</span>
              <span className="inline-flex px-3 py-1 bg-slate-950/60 border border-slate-800 rounded-full text-xs font-black text-white">
                {risk.priority || 'P3'}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-800/80 py-4">
            
            {/* Affected population */}
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-slate-950/40 rounded-lg text-slate-400">
                <Users size={16} />
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase">Impact Scope</span>
                <span className="text-xs font-semibold text-slate-200">
                  ~{risk.affectedPopulation?.toLocaleString() || '100'} Citizens
                </span>
              </div>
            </div>

            {/* Resolution Deadline */}
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-slate-950/40 rounded-lg text-slate-400">
                <Clock size={16} />
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase">SLA Target</span>
                <span className="text-xs font-semibold text-slate-200">
                  {risk.estimatedResolutionTime || '3 Days'}
                </span>
              </div>
            </div>

          </div>

          {/* Target Departments */}
          <div className="flex items-start gap-2.5">
            <div className="p-2 bg-slate-950/40 rounded-lg text-slate-400 mt-0.5">
              <Building size={16} />
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] text-slate-500 uppercase">Assigned Departments</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {risk.affectedDepartments?.map((dept, idx) => (
                  <span 
                    key={idx} 
                    className="text-[10px] font-semibold text-slate-350 bg-slate-950/30 border border-slate-850/65 px-2.5 py-0.5 rounded"
                  >
                    {dept}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Reliability Indicator */}
      <ConfidenceIndicator confidence={risk.confidence} />

    </div>
  );
}
