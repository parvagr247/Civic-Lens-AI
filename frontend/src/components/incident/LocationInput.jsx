import React, { useState } from 'react';
import { MapPin, Navigation, Loader2, AlertCircle } from 'lucide-react';
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
    // Attempt navigator geolocation first
    if (!navigator.geolocation) {
      setInsecureWarning(true);
      toast('Location detection is not supported by your browser.', 'warning');
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
        setInsecureWarning(true);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleAddressGeocode = async (addrVal) => {
    if (!addrVal || addrVal.trim().length < 5) return;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addrVal)}&limit=1`,
        {
          headers: {
            'User-Agent': 'CivicLensAI/1.0',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          onChange('latitude', lat);
          onChange('longitude', lon);
          toast('Address resolved to coordinates successfully!', 'success');
        }
      }
    } catch (error) {
      console.warn('Geocoding lookup failed', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
          <MapPin size={16} className="text-emerald-500 dark:text-emerald-400" />
          Location Details <span className="text-emerald-500 dark:text-emerald-400">*</span>
        </label>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={detecting}
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-400 dark:hover:bg-emerald-950/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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

      {/* Geolocation Info Panel */}
      {insecureWarning && (
        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 space-y-4 animate-fade-in shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
              <MapPin size={18} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-200">Location Detection Restricted</h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                Your browser blocks automatic geolocation on insecure HTTP connections. Placing this deployment on HTTPS will restore automatic location detection.
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mt-1.5">
                Manual coordinates and address options remain fully available.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5 pt-2 pl-11">
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={detecting}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-semibold shadow-sm transition-all duration-200"
            >
              {detecting ? 'Retrying...' : 'Retry Detection'}
            </button>
            <button
              type="button"
              onClick={() => {
                setInsecureWarning(false);
                if (latitude === '' || latitude === null || !latitude) {
                  onChange('latitude', 45.5152);
                }
                if (longitude === '' || longitude === null || !longitude) {
                  onChange('longitude', -122.6784);
                }
                if (!address) {
                  onChange('address', 'Portland, OR');
                }
                toast('Manual entry enabled. Fallback coordinates populated.', 'info');
              }}
              className="text-xs bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-slate-700 px-4 py-2 rounded-lg font-semibold shadow-sm transition-all duration-200"
            >
              Enter Location Manually
            </button>
            <button
              type="button"
              onClick={() => {
                setInsecureWarning(false);
                if (latitude === '' || latitude === null || !latitude) {
                  onChange('latitude', 45.5152);
                }
                if (longitude === '' || longitude === null || !longitude) {
                  onChange('longitude', -122.6784);
                }
                if (!address) {
                  onChange('address', 'Portland, OR');
                }
                toast('Continuing with default location coordinates.', 'info');
              }}
              className="text-xs bg-transparent hover:bg-gray-100 dark:hover:bg-slate-850 text-gray-500 dark:text-slate-400 px-4 py-2 rounded-lg font-medium transition-all duration-200"
            >
              Continue without Location
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5">Latitude</label>
          <input
            type="number"
            step="any"
            placeholder="e.g. 40.7128"
            value={latitude || ''}
            onChange={(e) => onChange('latitude', e.target.value ? parseFloat(e.target.value) : '')}
            className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-200 px-3.5 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 placeholder-gray-400 dark:placeholder-slate-600 transition-all duration-200 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5">Longitude</label>
          <input
            type="number"
            step="any"
            placeholder="e.g. -74.0060"
            value={longitude || ''}
            onChange={(e) => onChange('longitude', e.target.value ? parseFloat(e.target.value) : '')}
            className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-200 px-3.5 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 placeholder-gray-400 dark:placeholder-slate-600 transition-all duration-200 shadow-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5">Physical Address / Landmark</label>
        <input
          type="text"
          placeholder="e.g. 5th Avenue and 34th Street, New York"
          value={address || ''}
          onChange={(e) => onChange('address', e.target.value)}
          onBlur={(e) => handleAddressGeocode(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-200 px-3.5 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 placeholder-gray-400 dark:placeholder-slate-600 transition-all duration-200 shadow-sm"
        />
      </div>
    </div>
  );
}
