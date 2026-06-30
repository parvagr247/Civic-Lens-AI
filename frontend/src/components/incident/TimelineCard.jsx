import React from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import '../../styles/dashboard/RiskDashboard.css';

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
    <div className="w-full timeline-stepper rounded-xl p-5">
      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-5 flex items-center gap-1.5">
        <Clock size={14} className="text-emerald-500" />
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
                    checkpoints[idx + 1].time ? 'bg-emerald-500/60' : 'bg-border'
                  }`}
                />
              )}

              {/* Status Circle indicator */}
              <div className="shrink-0 z-10">
                {isDone ? (
                  <CheckCircle2 size={20} className="text-emerald-500 fill-emerald-500/10" />
                ) : (
                  <Circle size={20} className="text-muted-foreground/30 fill-muted/30" />
                )}
              </div>

              {/* Text labels */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-semibold ${isDone ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.label}
                  </span>
                  {isDone && (
                    <span className="text-[10px] text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1 rounded font-mono leading-none">
                      {formatTime(step.time)}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground leading-normal max-w-[160px]">
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
