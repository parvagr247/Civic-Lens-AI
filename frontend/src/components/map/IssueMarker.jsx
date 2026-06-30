import React from 'react';
import { AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

export default function IssueMarker({ incident, onClick }) {
  const lat = parseFloat(incident.location?.latitude);
  const lng = parseFloat(incident.location?.longitude);

  if (isNaN(lat) || isNaN(lng)) return null;

  // Determine pin colors based on status and priority/severity
  const getPinColors = () => {
    const status = incident.status?.toUpperCase() || 'REPORTED';
    const severity = incident.priority?.toUpperCase() || incident.risk?.severity?.toUpperCase() || 'MEDIUM';
    const threatLevel = incident.risk?.threatLevel?.toUpperCase() || '';

    if (status === 'RESOLVED' || status === 'CLOSED') {
      return {
        background: '#10b981', // Green
        borderColor: '#047857',
        glyphColor: '#d1fae5'
      };
    }
    if (severity === 'CRITICAL' || threatLevel === 'CRITICAL') {
      return {
        background: '#ef4444', // Red
        borderColor: '#b91c1c',
        glyphColor: '#fee2e2'
      };
    }
    if (severity === 'HIGH' || threatLevel === 'HIGH') {
      return {
        background: '#f97316', // Orange
        borderColor: '#c2410c',
        glyphColor: '#ffedd5'
      };
    }
    return {
      background: '#f59e0b', // Yellow (Under Review)
      borderColor: '#d97706',
      glyphColor: '#fef3c7'
    };
  };

  const colors = getPinColors();

  return (
    <AdvancedMarker
      position={{ lat, lng }}
      onClick={() => onClick(incident)}
      title={incident.title}
    >
      <Pin
        background={colors.background}
        borderColor={colors.borderColor}
        glyphColor={colors.glyphColor}
      />
    </AdvancedMarker>
  );
}
