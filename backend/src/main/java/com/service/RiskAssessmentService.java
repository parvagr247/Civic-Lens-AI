package com.service;

import com.dto.RiskStatisticsResponse;
import com.model.RiskAssessment;

import java.util.List;

/**
 * Service interface specifying Risk Assessment business operations.
 */
public interface RiskAssessmentService {

    /**
     * Executes AI Risk assessment for an incident that has completed issue analysis.
     *
     * @param incidentId Unique incident UUID.
     * @return Created RiskAssessment details.
     */
    RiskAssessment assessIncidentRisk(String incidentId);

    /**
     * Retrieves the RiskAssessment record associated with an incident.
     *
     * @param incidentId Unique incident UUID.
     * @return RiskAssessment profile.
     */
    RiskAssessment getRiskByIncidentId(String incidentId);

    /**
     * Re-runs the risk assessment prompt, updating the Firestore records.
     *
     * @param incidentId Unique incident UUID.
     * @return Updated RiskAssessment details.
     */
    RiskAssessment reanalyzeRisk(String incidentId);

    /**
     * Lists all risk assessments tagged as high priority/critical.
     *
     * @return High risk assessment profiles.
     */
    List<RiskAssessment> getHighRiskAssessments();

    /**
     * Aggregates city-wide risk diagnostics (average risk, priority spreads).
     *
     * @return RiskStatisticsResponse statistics payload.
     */
    RiskStatisticsResponse getStatistics();
}
