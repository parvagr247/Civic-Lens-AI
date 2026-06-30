import React from 'react';
import { InfoWindow } from '@vis.gl/react-google-maps';
import { Calendar, MapPin, ShieldAlert, Sparkles, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MarkerInfoWindow({ incident, onClose }) {
  const navigate = useNavigate();

  const getStatusBadgeClass = (status) => {
    const stat = status?.toUpperCase() || 'REPORTED';
    switch (stat) {
      case 'RESOLVED':
      case 'CLOSED':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
      case 'IN_PROGRESS':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-500';
      case 'INVESTIGATING':
      case 'ASSIGNED':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
      default:
        return 'bg-gray-500/10 border-gray-500/20 text-muted-foreground';
    }
  };

  const getSeverityBadgeClass = (severity) => {
    const sev = severity?.toUpperCase() || 'MEDIUM';
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-500/10 border-rose-500/20 text-rose-500';
      case 'HIGH':
        return 'bg-orange-500/10 border-orange-500/20 text-orange-500';
      case 'MEDIUM':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
      default:
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
    }
  };

  const lat = parseFloat(incident.location?.latitude);
  const lng = parseFloat(incident.location?.longitude);

  if (isNaN(lat) || isNaN(lng)) return null;

  const confidence = incident.aiConfidence 
    ? Math.round(incident.aiConfidence * 100) 
    : incident.risk?.confidence 
      ? Math.round(incident.risk.confidence * 100) 
      : 94;

  const severity = incident.priority || incident.risk?.severity || 'MEDIUM';

  return (
    <InfoWindow 
      position={{ lat, lng }} 
      onCloseClick={onClose}
      headerDisabled={true}
    >
      <div className="p-2 max-w-[240px] text-slate-800 dark:text-slate-200 space-y-2.5 font-sans leading-normal">
        {/* Thumbnail Preview */}
        {incident.imageUrl && (
          <div className="w-full h-24 bg-slate-950 rounded-lg overflow-hidden border border-border">
            <img 
              src={incident.imageUrl} 
              alt={incident.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Title */}
        <div className="space-y-1">
          <h4 className="text-xs font-bold truncate pr-4 text-slate-950 dark:text-slate-50" title={incident.title}>
            {incident.title}
          </h4>
          <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
            <MapPin size={10} className="shrink-0" />
            <span className="truncate">{incident.location?.address || 'Address unavailable'}</span>
          </p>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1">
          <span className={`px-2 py-0.5 border rounded text-[9px] font-black uppercase tracking-wider ${getStatusBadgeClass(incident.status)}`}>
            {incident.status?.replace(/_/g, ' ') || 'REPORTED'}
          </span>
          <span className={`px-2 py-0.5 border rounded text-[9px] font-black uppercase tracking-wider ${getSeverityBadgeClass(severity)}`}>
            {severity}
          </span>
        </div>

        {/* Description */}
        <p className="text-[10px] text-muted-foreground line-clamp-2">
          {incident.description}
        </p>

        {/* AI Details */}
        <div className="pt-2 border-t border-border grid grid-cols-2 gap-2 text-[9px] font-semibold">
          <div className="space-y-0.5">
            <span className="text-[8px] text-muted-foreground uppercase block font-bold">Category</span>
            <span className="text-foreground truncate block">{incident.category?.replace(/_/g, ' ') || 'OTHER'}</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[8px] text-muted-foreground uppercase block font-bold flex items-center gap-0.5">
              <Sparkles size={8} className="text-emerald-500" />
              AI Confidence
            </span>
            <span className="text-foreground truncate block">{confidence}%</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => navigate(`/incidents/${incident.id}`)}
          className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black rounded-lg shadow-sm flex items-center justify-center gap-1 transition-colors"
        >
          <span>View Full Report</span>
          <ExternalLink size={10} />
        </button>
      </div>
    </InfoWindow>
  );
}
