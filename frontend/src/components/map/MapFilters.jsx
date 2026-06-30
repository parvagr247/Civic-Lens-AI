import React from 'react';

export default function MapFilters({ activeFilter, onFilterChange }) {
  const filters = [
    { id: 'ALL', label: 'All Reports' },
    { id: 'ROADS', label: 'Roads & Potholes' },
    { id: 'SANITATION', label: 'Sanitation & Garbage' },
    { id: 'WATER', label: 'Water Leakage' },
    { id: 'ELECTRICAL', label: 'Street Lights' },
    { id: 'PARKS', label: 'Parks & Rec' },
    { id: 'CRITICAL', label: 'Critical Severity' },
    { id: 'RESOLVED', label: 'Resolved Issues' }
  ];

  return (
    <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-none">
      {filters.map(f => {
        const isActive = activeFilter === f.id;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onFilterChange(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
              isActive
                ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
