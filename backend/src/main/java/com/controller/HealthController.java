package com.controller;

import com.google.cloud.firestore.Firestore;
import com.constants.ResponseMessages;
import com.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * REST controller for health checks, versions, and system diagnostic endpoints.
 */
@Slf4j
@RestController
@Tag(name = "Diagnostics & Health", description = "Endpoints for monitoring system health and configuration status")
public class HealthController {

    private final Firestore firestore;
    private final ChatClient chatClient;

    public HealthController(Firestore firestore, ChatClient chatClient) {
        this.firestore = firestore;
        this.chatClient = chatClient;
    }

    /**
     * Verifies system operational status.
     * Performs a smoke test on Firestore and Gemini integrations.
     */
    @GetMapping("/api/health")
    @Operation(summary = "System Health Check", description = "Returns the status of backend, Firestore, and Spring AI services.")
    public ResponseEntity<ApiResponse<Map<String, String>>> getHealth() {
        log.info("Incoming request to GET /api/health");
        
        Map<String, String> healthDetails = new HashMap<>();
        boolean isFirestoreHealthy = false;
        boolean isGeminiHealthy = false;

        // Verify Firestore Connectivity
        try {
            if (firestore != null) {
                // Quick ping
                firestore.listCollections();
                healthDetails.put("firestore", "UP");
                isFirestoreHealthy = true;
            } else {
                healthDetails.put("firestore", "DOWN");
            }
        } catch (Exception e) {
            log.error("Health Check: Firestore is unavailable", e);
            healthDetails.put("firestore", "DOWN (" + e.getMessage() + ")");
        }

        // Verify Spring AI / Gemini Configuration
        try {
            if (chatClient != null) {
                healthDetails.put("gemini", "UP");
                isGeminiHealthy = true;
            } else {
                healthDetails.put("gemini", "DOWN");
            }
        } catch (Exception e) {
            log.error("Health Check: Spring AI client is unavailable", e);
            healthDetails.put("gemini", "DOWN (" + e.getMessage() + ")");
        }

        healthDetails.put("backend", "UP");

        if (isFirestoreHealthy && isGeminiHealthy) {
            ApiResponse<Map<String, String>> response = ApiResponse.success(
                    healthDetails,
                    ResponseMessages.HEALTH_CHECK_SUCCESS,
                    HttpStatus.OK.value()
            );
            return ResponseEntity.ok(response);
        } else {
            ApiResponse<Map<String, String>> response = ApiResponse.success(
                    healthDetails,
                    ResponseMessages.HEALTH_CHECK_DEGRADED,
                    HttpStatus.OK.value() // Still return 200 to convey API JSON detail
            );
            return ResponseEntity.ok(response);
        }
    }

    /**
     * Returns application version metadata.
     */
    @GetMapping("/api/version")
    @Operation(summary = "Retrieve Version Details", description = "Returns metadata about the currently deployed version of the application.")
    public ResponseEntity<ApiResponse<Map<String, String>>> getVersion() {
        log.info("Incoming request to GET /api/version");
        
        Map<String, String> versionDetails = Map.of(
                "applicationName", "CivicLens AI",
                "version", "1.0.0",
                "environment", "Development (Day 1 Framework)",
                "javaVersion", System.getProperty("java.version")
        );

        ApiResponse<Map<String, String>> response = ApiResponse.success(
                versionDetails,
                ResponseMessages.VERSION_RETRIEVAL_SUCCESS,
                HttpStatus.OK.value()
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Diagnostics endpoint returning basic JVM metrics.
     */
    @GetMapping("/api/status")
    @Operation(summary = "JVM Status Diagnostics", description = "Returns active thread counts and memory utilization metrics of the JVM.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatus() {
        log.info("Incoming request to GET /api/status");
        
        Runtime runtime = Runtime.getRuntime();
        long maxMemory = runtime.maxMemory();
        long allocatedMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();

        Map<String, Object> statusDetails = new HashMap<>();
        statusDetails.put("maxMemoryBytes", maxMemory);
        statusDetails.put("allocatedMemoryBytes", allocatedMemory);
        statusDetails.put("freeMemoryBytes", freeMemory);
        statusDetails.put("availableProcessors", runtime.availableProcessors());
        statusDetails.put("activeThreads", Thread.activeCount());

        ApiResponse<Map<String, Object>> response = ApiResponse.success(
                statusDetails,
                ResponseMessages.STATUS_RETRIEVAL_SUCCESS,
                HttpStatus.OK.value()
        );
        return ResponseEntity.ok(response);
    }
}
