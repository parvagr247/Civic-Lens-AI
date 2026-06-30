import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

export default function LocationSearch({ onSearchLocation, apiKey }) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    try {
      let lat, lng, displayName;
      let resolved = false;

      // 1. Try Google Geocoding API if key is present
      if (apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY') {
        try {
          const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;
          const res = await fetch(url);
          const data = await res.json();

          if (data.status === 'OK' && data.results && data.results.length > 0) {
            const loc = data.results[0].geometry.location;
            lat = loc.lat;
            lng = loc.lng;
            displayName = data.results[0].formatted_address;
            resolved = true;
          }
        } catch (googleErr) {
          console.warn('Google geocoding error, falling back to OSM:', googleErr);
        }
      }

      // 2. Fallback to OpenStreetMap Nominatim
      if (!resolved) {
        const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
        const osmRes = await fetch(osmUrl, {
          headers: {
            'User-Agent': 'CivicLensAI/1.0'
          }
        });
        const osmData = await osmRes.json();
        
        if (osmData && osmData.length > 0) {
          lat = parseFloat(osmData[0].lat);
          lng = parseFloat(osmData[0].lon);
          displayName = osmData[0].display_name;
          resolved = true;
        }
      }

      if (resolved) {
        onSearchLocation(lat, lng, displayName);
        setQuery('');
      } else {
        alert('Location not found. Please try another query.');
      }
    } catch (err) {
      console.error('Geocoding search failed:', err);
      alert('Failed to search location. Please check your network and try again.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:max-w-md">
      <div className="relative flex-1">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
          {searching ? <Loader2 className="animate-spin" size={14} /> : <Search size={14} />}
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search road, area, locality, city..."
          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl focus:border-emerald-500/50 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={searching}
        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition-colors shrink-0"
      >
        Search
      </button>
    </form>
  );
}
