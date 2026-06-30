package com.service;

import java.util.Map;

/**
 * Service contract for spatial GIS analytics, identifying critical infrastructure proximity.
 */
public interface GeoService {
    
    /**
     * Identifies nearby landmarks, schools, and hospitals based on GPS coordinates.
     * Calculates spatial hazard zones like flood plains and high traffic segments.
     *
     * @param latitude  Incident latitude.
     * @param longitude Incident longitude.
     * @return Map containing distance logs and zone flags.
     */
    Map<String, Object> analyzeNearbyContext(double latitude, double longitude);
}
