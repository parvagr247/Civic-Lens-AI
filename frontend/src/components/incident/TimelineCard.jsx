import React from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

/**
 * TimelineCard component.
 * Displays progress milestones and timestamps for the complete AI diagnostic pipeline.
 */
export default function TimelineCard({ incident, analysis, risk }) {
  // Format timestamps nicely
  const formatTime = (timestamp) => {
    if (!timestamp) return '--:--';
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const checkpoints = [
    {
      id: 'UPLOAD',
      label: 'Photo Uploaded',
      time: incident?.createdAt,
      description: 'Image file transmitted by citizen.',
    },
    {
      id: 'STORE',
      label: 'File Stored',
      time: incident?.createdAt ? incident.createdAt + 120 : null,
      description: 'Saved securely on Firebase Storage.',
    },
    {
      id: 'ANALYSIS',
      label: 'Vision Diagnostics',
      time: analysis?.analyzedAt,
      description: 'Gemini identified issue category and details.',
    },
    {
      id: 'RISK',
      label: 'Risk Evaluated',
      time: risk?.createdAt,
      description: 'Evaluated severity, urgency, and priorities.',
    },
    {
      id: 'COMPLETE',
      label: 'Completed',
      time: risk?.updatedAt,
      description: 'SLA priority generated and routed.',
    },
  ];

  return (
    <div className="w-full bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-xl">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-1.5">
        <Clock size={14} className="text-emerald-400" />
        Processing Execution Timeline
      </h4>

      {/* Horizontal Line Stepper */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-4 relative">
        {checkpoints.map((step, idx) => {
          const isDone = !!step.time;
          
          return (
            <div key={step.id} className="relative flex flex-row md:flex-col items-start gap-3 md:gap-2">
              {/* Connector line for desktop */}
              {idx < checkpoints.length - 1 && (
                <div 
                  className={`hidden md:block absolute top-2.5 left-6 w-[calc(100%-1.5rem)] h-[1px] transition-colors duration-500 ${
                    checkpoints[idx + 1].time ? 'bg-emerald-500/50' : 'bg-slate-800'
                  }`}
                />
              )}

              {/* Status Circle indicator */}
              <div className="shrink-0 z-10">
                {isDone ? (
                  <CheckCircle2 size={20} className="text-emerald-400 fill-emerald-950/40" />
                ) : (
                  <Circle size={20} className="text-slate-700 fill-slate-900" />
                )}
              </div>

              {/* Text labels */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-semibold ${isDone ? 'text-slate-200' : 'text-slate-500'}`}>
                    {step.label}
                  </span>
                  {isDone && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-900/40 px-1 rounded font-mono leading-none">
                      {formatTime(step.time)}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 leading-normal max-w-[160px]">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
