package com.service.impl;

import com.service.GeoService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class GeoServiceImpl implements GeoService {

    // Mock Landmark database representing city assets
    private static final Landmark[] LANDMARKS = {
            new Landmark("St. Jude General Hospital", 12.9716, 77.5946, "HOSPITAL"),
            new Landmark("City Memorial Clinic", 12.9820, 77.6050, "HOSPITAL"),
            new Landmark("Central High School", 12.9680, 77.5910, "SCHOOL"),
            new Landmark("St. Mary's Academy", 12.9750, 77.6100, "SCHOOL"),
            new Landmark("Main Water Treatment Plant", 12.9550, 77.5800, "INFRASTRUCTURE"),
            new Landmark("Substation 4B Electrical Grid", 12.9695, 77.5955, "INFRASTRUCTURE"),
            new Landmark("Valley Drainage Catchment Zone", 12.9650, 77.5880, "FLOOD_ZONE"),
            new Landmark("Commercial Center Ring Road", 12.9700, 77.5990, "HIGH_TRAFFIC")
    };

    @Override
    public Map<String, Object> analyzeNearbyContext(double latitude, double longitude) {
        log.info("Geo GIS: Analyzing infrastructure coordinates: ({}, {})", latitude, longitude);
        
        Landmark nearestSchool = null;
        double minSchoolDist = Double.MAX_VALUE;

        Landmark nearestHospital = null;
        double minHospitalDist = Double.MAX_VALUE;

        Landmark nearestInfra = null;
        double minInfraDist = Double.MAX_VALUE;

        boolean highTrafficZone = false;
        String floodRisk = "LOW";

        for (Landmark lm : LANDMARKS) {
            double distance = calculateDistance(latitude, longitude, lm.lat, lm.lon);
            
            switch (lm.type) {
                case "SCHOOL":
                    if (distance < minSchoolDist) {
                        minSchoolDist = distance;
                        nearestSchool = lm;
                    }
                    break;
                case "HOSPITAL":
                    if (distance < minHospitalDist) {
                        minHospitalDist = distance;
                        nearestHospital = lm;
                    }
                    break;
                case "INFRASTRUCTURE":
                    if (distance < minInfraDist) {
                        minInfraDist = distance;
                        nearestInfra = lm;
                    }
                    break;
                case "FLOOD_ZONE":
                    if (distance < 500) { // Within 500m of drainage zone
                        floodRisk = distance < 200 ? "HIGH" : "MEDIUM";
                    }
                    break;
                case "HIGH_TRAFFIC":
                    if (distance < 300) { // Within 300m of ring road
                        highTrafficZone = true;
                    }
                    break;
            }
        }

        Map<String, Object> results = new HashMap<>();
        
        if (nearestSchool != null) {
            Map<String, Object> schoolDetails = new HashMap<>();
            schoolDetails.put("name", nearestSchool.name);
            schoolDetails.put("distanceMeters", Math.round(minSchoolDist));
            results.put("nearbySchool", schoolDetails);
        }

        if (nearestHospital != null) {
            Map<String, Object> hospitalDetails = new HashMap<>();
            hospitalDetails.put("name", nearestHospital.name);
            hospitalDetails.put("distanceMeters", Math.round(minHospitalDist));
            results.put("nearbyHospital", hospitalDetails);
        }

        if (nearestInfra != null) {
            Map<String, Object> infraDetails = new HashMap<>();
            infraDetails.put("name", nearestInfra.name);
            infraDetails.put("distanceMeters", Math.round(minInfraDist));
            results.put("criticalInfrastructure", infraDetails);
        }

        results.put("highTrafficZone", highTrafficZone);
        results.put("floodZone", floodRisk);
        results.put("nightVisibility", "LOW"); // Placeholder default
        results.put("affectedPopulation", Math.round(150 + Math.random() * 800));

        return results;
    }

    /**
     * Computes Haversine distance in meters.
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double rLat1 = Math.toRadians(lat1);
        double rLat2 = Math.toRadians(lat2);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(rLat1) * Math.cos(rLat2);
        double c = 2 * Math.asin(Math.sqrt(a));
        return 6371000 * c;
    }

    private static class Landmark {
        String name;
        double lat;
        double lon;
        String type;

        Landmark(String name, double lat, double lon, String type) {
            this.name = name;
            this.lat = lat;
            this.lon = lon;
            this.type = type;
        }
    }
}
