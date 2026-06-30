import React, { useState } from 'react';
import { Navigation, Loader2 } from 'lucide-react';

export default function CurrentLocationButton({ onGetLocation, onLocationBlocked }) {
  const [loading, setLoading] = useState(false);

  const handleGetLocation = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      onLocationBlocked('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onGetLocation(position.coords.latitude, position.coords.longitude);
        setLoading(false);
      },
      (error) => {
        console.warn('Geolocation blocked or error:', error);
        // Geolocation requires HTTPS in modern browsers
        onLocationBlocked(
          window.location.protocol !== 'https:'
            ? 'Browser geolocation requires HTTPS. CivicLens AI requires a secure connection to read GPS automatically. Please search manually.'
            : 'Location access denied. Please allow location permissions in your browser settings.'
        );
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <button
      type="button"
      onClick={handleGetLocation}
      disabled={loading}
      className="px-3 py-2 bg-card hover:bg-muted border border-border text-muted-foreground hover:text-foreground rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 text-xs font-bold shrink-0"
      title="Get current location"
    >
      {loading ? <Loader2 className="animate-spin" size={14} /> : <Navigation size={14} />}
      <span>Locate Me</span>
    </button>
  );
}
