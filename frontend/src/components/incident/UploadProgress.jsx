import React from 'react';
import { Loader2, CheckCircle2, Circle } from 'lucide-react';

/**
 * UploadProgress component.
 * Stepper-based loading interface indicating progress checkpoints for the AI vision pipeline.
 */
export default function UploadProgress({ currentStep, progressPercent }) {
  const steps = [
    { id: 'UPLOAD', label: 'Uploading incident image to cloud...' },
    { id: 'SAVE', label: 'Saving incident metadata...' },
    { id: 'ANALYZE', label: 'Analyzing with Gemini Vision...' },
    { id: 'REPORT', label: 'Generating structured reports...' },
  ];

  const getStepIndex = (stepId) => {
    return steps.findIndex(s => s.id === stepId);
  };

  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="w-full bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-xl animate-fade-in">
      <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <Loader2 size={18} className="animate-spin text-emerald-400" />
        Processing Civic Issue
      </h3>

      {/* Progress Bar (Visible during file upload phase) */}
      {currentStep === 'UPLOAD' && (
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-xs font-medium text-slate-400">
            <span>Uploading File</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Checkpoints Stepper */}
      <div className="space-y-4">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isActive = idx === currentIndex;

          return (
            <div 
              key={step.id} 
              className={`flex items-center gap-3 transition-opacity duration-300 ${
                isCompleted || isActive ? 'opacity-100' : 'opacity-40'
              }`}
            >
              <div className="shrink-0">
                {isCompleted ? (
                  <CheckCircle2 size={18} className="text-emerald-500 fill-emerald-950/40" />
                ) : isActive ? (
                  <Loader2 size={18} className="animate-spin text-emerald-400" />
                ) : (
                  <Circle size={18} className="text-slate-600" />
                )}
              </div>
              <span className={`text-sm ${
                isActive ? 'text-slate-200 font-medium' : isCompleted ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
