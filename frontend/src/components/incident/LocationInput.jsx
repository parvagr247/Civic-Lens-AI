import React, { useState } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

/**
 * LocationInput component.
 * Captures spatial coordinates and address strings, supporting HTML5 Geolocation autofill.
 */
export default function LocationInput({ latitude, longitude, address, onChange }) {
  const [detecting, setDetecting] = useState(false);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

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
          } else {
            onChange('address', `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          }
        } catch (error) {
          console.warn('Reverse geocoding failed, falling back to coordinate labels.', error);
          onChange('address', `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } finally {
          setDetecting(false);
        }
      },
      (error) => {
        console.error('Error fetching position', error);
        setDetecting(false);
        alert(`Failed to detect location: ${error.message}`);
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
