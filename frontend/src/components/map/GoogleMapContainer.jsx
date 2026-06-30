import React, { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import IssueMarker from './IssueMarker';
import MarkerInfoWindow from './MarkerInfoWindow';

// Heatmap Layer sub-component
function HeatmapLayer({ incidents }) {
  const map = useMap();
  const heatmapRef = useRef(null);

  useEffect(() => {
    if (!map || !window.google || !incidents || incidents.length === 0) {
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
        heatmapRef.current = null;
      }
      return;
    }

    const points = incidents
      .map(inc => {
        const lat = parseFloat(inc.location?.latitude);
        const lng = parseFloat(inc.location?.longitude);
        if (isNaN(lat) || isNaN(lng)) return null;
        return new window.google.maps.LatLng(lat, lng);
      })
      .filter(Boolean);

    if (heatmapRef.current) {
      heatmapRef.current.setData(points);
    } else {
      heatmapRef.current = new window.google.maps.visualization.HeatmapLayer({
        data: points,
        map: map,
        radius: 30,
        opacity: 0.8
      });
    }

    return () => {
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
        heatmapRef.current = null;
      }
    };
  }, [map, incidents]);

  return null;
}

// Marker Clusterer wrapper component
function ClustererWrapper({ incidents, onMarkerClick, viewMode }) {
  const map = useMap();
  const clusterer = useRef(null);
  const markerRefs = useRef({});

  // Initialize clusterer
  useEffect(() => {
    if (!map) return;
    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({ map });
    }
  }, [map]);

  // Update clusterer when markers or viewMode changes
  useEffect(() => {
    if (!clusterer.current) return;

    clusterer.current.clearMarkers();

    if (viewMode === 'marker') {
      const activeMarkers = Object.values(markerRefs.current).filter(Boolean);
      clusterer.current.addMarkers(activeMarkers);
    }
  }, [incidents, viewMode]);

  return (
    <>
      {viewMode === 'marker' && incidents.map((inc) => {
        const lat = parseFloat(inc.location?.latitude);
        const lng = parseFloat(inc.location?.longitude);
        if (isNaN(lat) || isNaN(lng)) return null;

        return (
          <AdvancedMarker
            key={inc.id}
            position={{ lat, lng }}
            onClick={() => onMarkerClick(inc)}
            ref={(markerInstance) => {
              if (markerInstance) {
                // The MarkerClusterer library expects the raw google.maps.marker.AdvancedMarkerElement
                // `@vis.gl/react-google-maps` exposes it on the ref, but if not, the ref object itself is the marker element
                markerRefs.current[inc.id] = markerInstance;
              } else {
                delete markerRefs.current[inc.id];
              }
            }}
          >
            <IssueMarkerPin incident={inc} />
          </AdvancedMarker>
        );
      })}
    </>
  );
}

// Small helper component to render custom pin colors
function IssueMarkerPin({ incident }) {
  const getPinColors = () => {
    const status = incident.status?.toUpperCase() || 'REPORTED';
    const severity = incident.priority?.toUpperCase() || incident.risk?.severity?.toUpperCase() || 'MEDIUM';
    const threatLevel = incident.risk?.threatLevel?.toUpperCase() || '';

    if (status === 'RESOLVED' || status === 'CLOSED') {
      return { background: '#10b981', borderColor: '#047857', glyphColor: '#d1fae5' };
    }
    if (severity === 'CRITICAL' || threatLevel === 'CRITICAL') {
      return { background: '#ef4444', borderColor: '#b91c1c', glyphColor: '#fee2e2' };
    }
    if (severity === 'HIGH' || threatLevel === 'HIGH') {
      return { background: '#f97316', borderColor: '#c2410c', glyphColor: '#ffedd5' };
    }
    return { background: '#f59e0b', borderColor: '#d97706', glyphColor: '#fef3c7' };
  };

  const colors = getPinColors();

  return (
    <Pin
      background={colors.background}
      borderColor={colors.borderColor}
      glyphColor={colors.glyphColor}
    />
  );
}

export default function GoogleMapContainer({ 
  apiKey, 
  incidents, 
  userLocation, 
  cameraState, 
  onCameraChange,
  viewMode // 'marker' or 'heatmap'
}) {
  const [selectedIncident, setSelectedIncident] = useState(null);

  const handleMarkerClick = (incident) => {
    setSelectedIncident(incident);
  };

  const handleCloseInfoWindow = () => {
    setSelectedIncident(null);
  };

  // Center coordinates for user's blue dot
  const userPosition = userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null;

  return (
    <APIProvider apiKey={apiKey} libraries={['visualization']}>
      <div className="w-full h-full relative rounded-2xl overflow-hidden border border-border shadow-inner bg-muted/20">
        <Map
          {...cameraState}
          onCameraChanged={(ev) => onCameraChange(ev.detail)}
          mapId="DEMO_MAP_ID" // Required for AdvancedMarker
          gestureHandling="cooperative"
          disableDefaultUI={false}
          className="w-full h-full"
        >
          {/* Blue User Current Location Marker */}
          {userPosition && (
            <AdvancedMarker position={userPosition} title="Your Current Location">
              <Pin
                background="#3b82f6"
                borderColor="#1d4ed8"
                glyphColor="#dbeafe"
                scale={1.1}
              />
            </AdvancedMarker>
          )}

          {/* Clustered Markers (only active in marker mode) */}
          <ClustererWrapper 
            incidents={incidents} 
            onMarkerClick={handleMarkerClick} 
            viewMode={viewMode}
          />

          {/* Heatmap overlay (only active in heatmap mode) */}
          {viewMode === 'heatmap' && <HeatmapLayer incidents={incidents} />}

          {/* Info Window */}
          {selectedIncident && (
            <MarkerInfoWindow 
              incident={selectedIncident} 
              onClose={handleCloseInfoWindow} 
            />
          )}
        </Map>
      </div>
    </APIProvider>
  );
}
