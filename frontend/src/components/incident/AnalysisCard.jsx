import React, { useState } from 'react';
import { Brain, ShieldAlert, Sparkles, Wrench, FileText, Activity, Layers, Calendar, ChevronRight, ChevronDown } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

/**
 * AnalysisCard component.
 * Displays AI Vision analysis alongside reported issue metadata using premium UI layouts.
 */
export default function AnalysisCard({ incident, analysis }) {
  const [showReasoning, setShowReasoning] = useState(false);

  if (!incident || !analysis) return null;

  // Determine confidence color mapping
  const confidencePercent = Math.round(analysis.confidence * 100);
  const getConfidenceColor = (score) => {
    if (score >= 0.85) return 'text-emerald-400 bg-emerald-950/40 border-emerald-900/60';
    if (score >= 0.6) return 'text-amber-400 bg-amber-950/40 border-amber-900/60';
    return 'text-rose-400 bg-rose-950/40 border-rose-900/60';
  };

  const getConfidenceBarColor = (score) => {
    if (score >= 85) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  // Humanize enum strings
  const formatEnum = (str) => {
    if (!str) return '';
    return str.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Reported Image & Info */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video shadow-lg group">
            <img
              src={incident.imageUrl}
              alt={incident.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
            />
            <div className="absolute top-3 left-3">
              <Badge variant="success">
                {formatEnum(incident.status)}
              </Badge>
            </div>
            <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-sm border border-slate-800 rounded-lg py-1.5 px-3 flex items-center gap-1.5 text-xs text-slate-300">
              <Calendar size={12} className="text-emerald-400" />
              <span>{new Date(incident.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <Card className="p-4 space-y-2">
            <h4 className="text-sm font-semibold text-slate-300">User Report Details</h4>
            <div className="space-y-1">
              <p className="text-xs text-slate-500">Title</p>
              <p className="text-sm text-slate-200 font-medium">{incident.title}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-500">Description</p>
              <p className="text-sm text-slate-300 leading-relaxed">{incident.description}</p>
            </div>
            <div className="space-y-1 pt-1.5 border-t border-slate-800">
              <p className="text-xs text-slate-500">Reported Address</p>
              <p className="text-xs text-slate-400">{incident.location?.address}</p>
            </div>
          </Card>
        </div>

        {/* Right Side: AI Intelligence Analysis */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
            
            {/* Header / Category / Confidence */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 rounded-lg">
                  <Brain size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">AI Classification</span>
                    <Sparkles size={12} className="text-emerald-400 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-100 mt-0.5">
                    {formatEnum(incident.category)}
                  </h3>
                </div>
              </div>

              {/* Confidence Rating */}
              <div className={`border rounded-xl py-2 px-4 flex flex-col items-center shrink-0 ${getConfidenceColor(analysis.confidence)}`}>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">AI Confidence</span>
                <span className="text-2xl font-black mt-0.5 leading-none">{confidencePercent}%</span>
              </div>
            </div>

            {/* AI Summary */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <FileText size={14} className="text-emerald-400" />
                <span>Executive Summary</span>
              </div>
              <p className="text-slate-200 text-sm leading-relaxed bg-slate-950/30 border border-slate-850 p-4 rounded-xl">
                {analysis.summary}
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Likely Cause */}
              <div className="bg-slate-950/20 border border-slate-850 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <Activity size={14} className="text-emerald-400" />
                  <span>Likely Cause</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {analysis.likelyCause}
                </p>
              </div>

              {/* Confidence Bar */}
              <div className="bg-slate-950/20 border border-slate-850 p-4 rounded-xl space-y-3 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <ShieldAlert size={14} className="text-emerald-400" />
                  <span>Reliability Meter</span>
                </div>
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${getConfidenceBarColor(confidencePercent)}`}
                      style={{ width: `${confidencePercent}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    High threshold models check verified signals.
                  </p>
                </div>
              </div>
            </div>

            {/* Observed Damages */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <Layers size={14} className="text-emerald-400" />
                <span>Observed Damages</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {analysis.observedDamages?.map((damage, idx) => (
                  <li 
                    key={idx} 
                    className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/30 border border-slate-850/60 py-2 px-3 rounded-lg"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate">{damage}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Action */}
            <div className="bg-emerald-950/10 border border-emerald-900/20 p-4 rounded-xl flex gap-3">
              <div className="p-2 bg-emerald-950/60 border border-emerald-900/60 text-emerald-400 rounded-lg shrink-0 h-10 w-10 flex items-center justify-center">
                <Wrench size={18} />
              </div>
              <div className="space-y-1">
                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Recommended Next Step</h5>
                <p className="text-emerald-300 text-sm leading-relaxed">
                  {analysis.recommendedAction}
                </p>
              </div>
            </div>

            {/* Accordion for Technical Reasoning */}
            <div className="border border-slate-850 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowReasoning(!showReasoning)}
                className="w-full flex items-center justify-between p-4 bg-slate-950/20 hover:bg-slate-950/40 text-slate-300 transition-colors duration-200"
              >
                <span className="text-sm font-semibold flex items-center gap-2">
                  <Brain size={16} className="text-emerald-400" />
                  Technical reasoning & justification
                </span>
                {showReasoning ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              
              {showReasoning && (
                <div className="p-4 bg-slate-950/10 border-t border-slate-850 text-xs text-slate-400 leading-relaxed animate-slide-down">
                  {analysis.reasoning}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
