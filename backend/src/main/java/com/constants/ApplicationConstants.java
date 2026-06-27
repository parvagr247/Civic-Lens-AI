package com.constants;

/**
 * Global application constants.
 * Designed to prevent magic strings and maintain consistency throughout the backend codebase.
 */
public final class ApplicationConstants {

    private ApplicationConstants() {
        // Prevent instantiation
    }

    public static final String API_V1_PREFIX = "/api/v1";
    
    // API headers and diagnostic identifiers
    public static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
    public static final String SYSTEM_USER = "SYSTEM";
    
    // AI workflow configuration limits
    public static final int MAX_AI_RETRIES = 3;
    public static final double DEFAULT_GEO_RADIUS_KM = 5.0;

    // Date and time formats
    public static final String DATE_TIME_FORMAT_ISO = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'";
}
