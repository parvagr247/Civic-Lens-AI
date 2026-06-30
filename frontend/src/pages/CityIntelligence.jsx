import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Map as MapIcon, MapPin, Eye, BarChart4, TrendingUp, Info, ShieldAlert, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from '../components/ui/ToastProvider';
import { getAllIncidents } from '../services/issueService';

// Map components
import GoogleMapContainer from '../components/map/GoogleMapContainer';
import MapFilters from '../components/map/MapFilters';
import LocationSearch from '../components/map/LocationSearch';
import CurrentLocationButton from '../components/map/CurrentLocationButton';

export default function CityIntelligence() {
  const { toast } = useToast();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Data states
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('marker'); // 'marker' or 'heatmap'

  // Map states
  const [cameraState, setCameraState] = useState({
    center: { lat: 26.9124, lng: 75.7873 }, // Default to Jaipur
    zoom: 12
  });
  const [userLocation, setUserLocation] = useState(null);
  const [locationWarning, setLocationWarning] = useState(null);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await getAllIncidents();
      if (res.success && res.data) {
        setIncidents(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
      toast('Failed to load incident reports.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();

    // Try to get browser location on mount if possible
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(loc);
          setCameraState({ center: loc, zoom: 12 });
        },
        (err) => {
          console.log('Initial geolocation block/error (expected on HTTP):', err.message);
        }
      );
    }
  }, []);

  const handleSearchLocation = (lat, lng, address) => {
    setCameraState({ center: { lat, lng }, zoom: 14 });
    toast(`Centering map on: ${address.split(',')[0]}`, 'success');
  };

  const handleGetLocation = (lat, lng) => {
    const loc = { lat, lng };
    setUserLocation(loc);
    setCameraState({ center: loc, zoom: 14 });
    setLocationWarning(null);
    toast('Centered map on your current location.', 'success');
  };

  const handleLocationBlocked = (warningMessage) => {
    setLocationWarning(warningMessage);
    toast('Automatic location access blocked.', 'warning');
  };

  // Frontend Filtering
  const filteredIncidents = incidents.filter(r => {
    if (activeFilter === 'ALL') return true;
    
    // Category mapping
    if (activeFilter === 'ROADS') {
      return ['ROADS', 'ROAD', 'POTHOLE', 'ROAD_DAMAGE'].includes(r.category?.toUpperCase());
    }
    if (activeFilter === 'SANITATION') {
      return ['SANITATION', 'GARBAGE', 'WASTE'].includes(r.category?.toUpperCase());
    }
    if (activeFilter === 'WATER') {
      return ['WATER', 'WATER_LEAKAGE', 'LEAKAGE'].includes(r.category?.toUpperCase());
    }
    if (activeFilter === 'ELECTRICAL') {
      return ['ELECTRICAL', 'STREET_LIGHT', 'POWER'].includes(r.category?.toUpperCase());
    }
    if (activeFilter === 'PARKS') {
      return ['PARKS', 'PARKS_REC'].includes(r.category?.toUpperCase());
    }

    // Priorities
    if (activeFilter === 'CRITICAL') {
      const severity = r.priority?.toUpperCase() || r.risk?.severity?.toUpperCase() || '';
      const threat = r.risk?.threatLevel?.toUpperCase() || '';
      const score = r.risk?.overallRiskScore || 0;
      return severity === 'CRITICAL' || threat === 'CRITICAL' || score >= 70;
    }

    // Statuses
    if (activeFilter === 'RESOLVED') {
      return ['RESOLVED', 'CLOSED'].includes(r.status?.toUpperCase());
    }

    return true;
  });

  // Hotspot computation
  const getZoneSummary = () => {
    const resolved = incidents.filter(r => ['RESOLVED', 'CLOSED'].includes(r.status?.toUpperCase())).length;
    const critical = incidents.filter(r => {
      const severity = r.priority?.toUpperCase() || r.risk?.severity?.toUpperCase() || '';
      const score = r.risk?.overallRiskScore || 0;
      return severity === 'CRITICAL' || score >= 70;
    }).length;

    return {
      total: incidents.length,
      active: incidents.length - resolved,
      resolved,
      critical
    };
  };

  const summary = getZoneSummary();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader 
          title="City Intelligence Hub" 
          subtitle="Real-time geospatial distribution of active reports, hot zone heatmaps, and priority dispatches."
        />
        <div className="flex gap-2">
          <Button
            onClick={() => setViewMode(prev => prev === 'marker' ? 'heatmap' : 'marker')}
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 border-border hover:bg-muted text-xs font-bold"
          >
            <Sparkles size={14} className="text-emerald-500" />
            <span>Switch to {viewMode === 'marker' ? 'Heatmap' : 'Pins'}</span>
          </Button>
          <Button 
            onClick={fetchIncidents} 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1.5 border-border hover:bg-muted text-xs font-bold"
          >
            <RefreshCw size={14} />
            <span>Refresh Map</span>
          </Button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total Reports</span>
          <span className="text-2xl font-black text-foreground mt-2">{summary.total}</span>
        </Card>
        <Card className="p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-rose-500 uppercase tracking-widest font-bold">Active Threats</span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">{summary.active}</span>
        </Card>
        <Card className="p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-amber-500 uppercase tracking-widest font-bold">Critical Priority</span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">{summary.critical}</span>
        </Card>
        <Card className="p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">Resolved Cases</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{summary.resolved}</span>
        </Card>
      </div>

      {/* Geolocation & Search Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card border border-border p-4 rounded-2xl shadow-sm">
        <LocationSearch onSearchLocation={handleSearchLocation} apiKey={apiKey} />
        <CurrentLocationButton 
          onGetLocation={handleGetLocation} 
          onLocationBlocked={handleLocationBlocked} 
        />
      </div>

      {/* Location Access HTTPS Warning Box */}
      {locationWarning && (
        <div className="flex gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-600 dark:text-amber-400 animate-scale-in">
          <Info size={16} className="shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Insecure Geolocation Warning</span>
            <p className="opacity-90 leading-relaxed">
              {locationWarning} You can still manually search and navigate to any address using the search bar above.
            </p>
          </div>
        </div>
      )}

      {/* Filter Chips */}
      <div className="space-y-2">
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider block font-bold">Operational Filter Layers</span>
        <MapFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      </div>

      {/* Live Google Map Container */}
      <Card className="overflow-hidden h-[500px] flex flex-col border border-border shadow-md">
        <CardHeader className="bg-gray-50/50 dark:bg-slate-950/20 border-b border-border py-4 px-6 flex flex-row items-center justify-between shrink-0">
          <div>
            <CardTitle className="text-sm font-bold text-foreground">Operational Geographic View</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Showing {filteredIncidents.length} filtered incident dispatches on operational grid.</CardDescription>
          </div>
          <MapIcon className="w-5 h-5 text-emerald-500" />
        </CardHeader>
        <CardContent className="p-0 flex-1 relative min-h-0">
          {!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-muted/20 gap-3">
              <AlertTriangle className="w-12 h-12 text-amber-500 animate-pulse" />
              <h4 className="font-bold text-foreground text-sm">Google Maps API Key Missing</h4>
              <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                Add your Maps API Key as <code>VITE_GOOGLE_MAPS_API_KEY</code> inside the <code>frontend/.env</code> configuration file to load the live Operational Geographic Map.
              </p>
            </div>
          ) : (
            <GoogleMapContainer 
              apiKey={apiKey} 
              incidents={filteredIncidents} 
              userLocation={userLocation}
              cameraState={cameraState}
              onCameraChange={setCameraState}
              viewMode={viewMode}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
