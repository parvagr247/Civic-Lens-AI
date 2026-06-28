package com.service;

import com.model.DispatchRecommendation;
import java.util.Map;

/**
 * Service managing operational intelligence, automated dispatches, SLAs, and escalations.
 */
public interface OperationsService {

    /**
     * Resolves or dynamically generates AI dispatch recommendations for an incident.
     */
    DispatchRecommendation getOrGenerateRecommendation(String incidentId);

    /**
     * Enforces SLA alerts, inactive warnings, and bumps priorities of overdue dispatches.
     */
    void runEscalationEngineChecks();

    /**
     * Records a citizen's resolution confirmation (closings) or rejection (reopenings).
     */
    void verifyResolution(String incidentId, boolean confirm, String feedback, String reopenPhotoUrl, String citizenEmail);

    /**
     * Aggregates workloads, resolved ratios, and average completion hours across municipal departments.
     */
    Map<String, Object> getDepartmentAnalytics();
}
