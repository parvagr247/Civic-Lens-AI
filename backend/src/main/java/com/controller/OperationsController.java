package com.controller;

import com.dto.ApiResponse;
import com.model.DispatchRecommendation;
import com.service.OperationsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller managing smart city dispatches, SLA escalation alerts, and citizen resolution confirmations.
 */
@Slf4j
@RestController
@RequestMapping("/api/operations")
@RequiredArgsConstructor
public class OperationsController {

    private final OperationsService operationsService;

    /**
     * Get AI-recommended routing details for a reported incident.
     */
    @GetMapping("/recommendation/{incidentId}")
    public ResponseEntity<ApiResponse<DispatchRecommendation>> getRecommendation(@PathVariable String incidentId) {
        log.info("REST: Querying AI dispatch recommendation for incident {}", incidentId);
        DispatchRecommendation rec = operationsService.getOrGenerateRecommendation(incidentId);
        return ResponseEntity.ok(ApiResponse.success(rec, "AI recommendation generated", 200));
    }

    /**
     * Trigger manual/cron-based overdue SLA validation check.
     */
    @PostMapping("/escalate/check")
    public ResponseEntity<ApiResponse<Void>> triggerEscalationCheck() {
        log.info("REST: Manually triggering SLA escalation cron checker.");
        operationsService.runEscalationEngineChecks();
        return ResponseEntity.ok(ApiResponse.success("SLA escalations checks successfully processed.", 200));
    }

    /**
     * Fetch aggregated municipal workloads, completed metrics, and roster ratings.
     */
    @GetMapping("/analytics/departments")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDepartmentAnalytics() {
        log.info("REST: Querying departmental workloads metrics.");
        Map<String, Object> data = operationsService.getDepartmentAnalytics();
        return ResponseEntity.ok(ApiResponse.success(data, "Departmental analytics resolved", 200));
    }

    /**
     * Citizen verify fix payload structure.
     */
    public static class VerificationRequest {
        public boolean confirm;
        public String feedback;
        public String reopenPhotoUrl;
    }

    /**
     * Submit feedback and verify if a resolution meets citizen expectations.
     */
    @PostMapping("/verify/{incidentId}")
    public ResponseEntity<ApiResponse<Void>> verifyResolution(
            @PathVariable String incidentId,
            @RequestBody VerificationRequest request
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String citizenEmail = auth.getName();
        log.info("REST: Citizen {} submitting verification for incident {}", citizenEmail, incidentId);

        operationsService.verifyResolution(
                incidentId,
                request.confirm,
                request.feedback,
                request.reopenPhotoUrl,
                citizenEmail
        );

        String message = request.confirm ? "Fix confirmed. Ticket closed." : "Fix rejected. Ticket reopened.";
        return ResponseEntity.ok(ApiResponse.success(message, 200));
    }
}
