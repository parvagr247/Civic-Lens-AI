package com.constants;

/**
 * Standardized user-facing and API response messages.
 * Keeps communication messages unified across the API endpoints.
 */
public final class ResponseMessages {

    private ResponseMessages() {
        // Prevent instantiation
    }

    public static final String HEALTH_CHECK_SUCCESS = "System is fully operational.";
    public static final String HEALTH_CHECK_DEGRADED = "System is operating in a degraded state.";
    public static final String VERSION_RETRIEVAL_SUCCESS = "Version retrieved successfully.";
    public static final String STATUS_RETRIEVAL_SUCCESS = "Diagnostics and server status retrieved successfully.";

    // Exception and error messages
    public static final String UNEXPECTED_ERROR = "An unexpected error occurred. Please contact system administrators.";
    public static final String INVALID_INPUT = "Validation failed for the requested payload.";
    public static final String FIREBASE_INITIALIZATION_ERROR = "Failed to bootstrap Google Firebase services.";
    public static final String FIRESTORE_ACCESS_ERROR = "Failed to communicate with Firestore database.";
    public static final String AI_ORCHESTRATION_ERROR = "Failed to orchestrate AI analysis workflow.";
    public static final String RESOURCE_NOT_FOUND = "The requested resource could not be found.";
}
