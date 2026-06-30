import React, { useState } from 'react';
import { MapPin, Navigation, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '../ui/ToastProvider';

/**
 * LocationInput component.
 * Captures spatial coordinates and address strings, supporting HTML5 Geolocation autofill.
 */
export default function LocationInput({ latitude, longitude, address, onChange }) {
  const { toast } = useToast();
  const [detecting, setDetecting] = useState(false);
  const [insecureWarning, setInsecureWarning] = useState(false);

  const handleGetCurrentLocation = () => {
    // Detect whether browser supports geolocation and is running in a secure context
    if (!navigator.geolocation || !window.isSecureContext) {
      setInsecureWarning(true);
      toast('Location detection is blocked on HTTP connections.', 'warning');
      return;
    }

    setInsecureWarning(false);
    setDetecting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        onChange('latitude', lat);
        onChange('longitude', lng);

        try {
          // Attempt reverse geocoding via OpenStreetMap free API
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            {
              headers: {
                'User-Agent': 'CivicLensAI/1.0',
              },
            }
          );
          if (response.ok) {
            const data = await response.json();
            onChange('address', data.display_name || `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
            toast('Location coordinates auto-filled successfully!', 'success');
          } else {
            onChange('address', `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
            toast('Location coordinates captured.', 'success');
          }
        } catch (error) {
          console.warn('Reverse geocoding failed, falling back to coordinate labels.', error);
          onChange('address', `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          toast('Location coordinates captured.', 'success');
        } finally {
          setDetecting(false);
        }
      },
      (error) => {
        console.error('Error fetching position', error);
        setDetecting(false);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast('Location permission denied. Please grant permission in browser settings or enter manually.', 'error');
            break;
          case error.POSITION_UNAVAILABLE:
            toast('Position unavailable. Please specify coordinates manually.', 'error');
            break;
          case error.TIMEOUT:
            toast('Location detection request timed out. Please try again or enter manually.', 'error');
            break;
          default:
            toast(`Failed to detect location: ${error.message}`, 'error');
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
          <MapPin size={16} className="text-emerald-400" />
          Location details <span className="text-emerald-400">*</span>
        </label>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={detecting}
          className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium px-2.5 py-1 bg-emerald-950/40 border border-emerald-900/60 hover:bg-emerald-950/80 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {detecting ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Detecting...
            </>
          ) : (
            <>
              <Navigation size={12} />
              Get Current Location
            </>
          )}
        </button>
      </div>

      {/* Insecure Context warning alerts panel */}
      {insecureWarning && (
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40 text-amber-400 space-y-3 animate-fade-in">
          <div className="flex items-start gap-2.5 text-xs font-bold leading-normal">
            <AlertTriangle className="shrink-0 mt-0.5 text-amber-400 animate-pulse" size={16} />
            <div>
              <p>Current location is only available when CivicLens is accessed over HTTPS.</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Please select an action below to proceed:</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5 pl-6">
            <button
              type="button"
              onClick={() => {
                setInsecureWarning(false);
                toast('Please enter coordinates and address manually below.', 'info');
              }}
              className="text-[10px] bg-amber-500 text-slate-955 px-3 py-1.5 rounded-lg font-extrabold hover:bg-amber-400 transition-all duration-200"
            >
              Enter location manually
            </button>
            <button
              type="button"
              onClick={() => {
                setInsecureWarning(false);
                toast('Continuing without automatic location.', 'info');
              }}
              className="text-[10px] border border-amber-900/60 text-amber-300 hover:bg-amber-950/40 px-3 py-1.5 rounded-lg font-bold transition-all duration-200"
            >
              Continue without automatic location
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Latitude</label>
          <input
            type="number"
            step="any"
            placeholder="e.g. 40.7128"
            value={latitude || ''}
            onChange={(e) => onChange('latitude', e.target.value ? parseFloat(e.target.value) : '')}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 px-3.5 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 placeholder-slate-600 transition-all duration-200"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Longitude</label>
          <input
            type="number"
            step="any"
            placeholder="e.g. -74.0060"
            value={longitude || ''}
            onChange={(e) => onChange('longitude', e.target.value ? parseFloat(e.target.value) : '')}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 px-3.5 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 placeholder-slate-600 transition-all duration-200"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1.5">Physical Address / Landmark</label>
        <input
          type="text"
          placeholder="e.g. 5th Avenue and 34th Street, New York"
          value={address || ''}
          onChange={(e) => onChange('address', e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 text-slate-200 px-3.5 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 placeholder-slate-600 transition-all duration-200"
        />
      </div>
    </div>
  );
}
