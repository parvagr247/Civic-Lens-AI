package com.mapper;

import com.dto.RiskAssessmentResponse;
import com.model.Incident;
import com.model.RiskAssessment;
import com.repository.IncidentRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Mapper component converting RiskAssessment entities to API-friendly response DTOs.
 * Performs safe joins with the Incident repository to enrich the payload with rendering context.
 */
@Slf4j
@Component
public class RiskAssessmentMapper {

    private final IncidentRepository incidentRepository;

    public RiskAssessmentMapper(IncidentRepository incidentRepository) {
        this.incidentRepository = incidentRepository;
    }

    /**
     * Maps a RiskAssessment domain object to its enriched DTO representation.
     */
    public RiskAssessmentResponse toResponse(RiskAssessment assessment) {
        if (assessment == null) {
            return null;
        }

        // Fetch parent incident to enrich response
        Incident incident = null;
        try {
            incident = incidentRepository.findById(assessment.getIncidentId());
        } catch (Exception e) {
            log.warn("Failed to retrieve parent incident {} during risk response mapping", assessment.getIncidentId());
        }

        return RiskAssessmentResponse.builder()
                .id(assessment.getId())
                .incidentId(assessment.getIncidentId())
                .overallRiskScore(assessment.getOverallRiskScore())
                .severity(assessment.getSeverity() != null ? assessment.getSeverity().name() : null)
                .urgency(assessment.getUrgency() != null ? assessment.getUrgency().name() : null)
                .confidence(assessment.getConfidence())
                .priority(assessment.getPriority() != null ? assessment.getPriority().name() : null)
                .threatLevel(assessment.getThreatLevel() != null ? assessment.getThreatLevel().name() : null)
                .estimatedResolutionTime(assessment.getEstimatedResolutionTime())
                .affectedPopulation(assessment.getAffectedPopulation())
                .affectedDepartments(assessment.getAffectedDepartments())
                .potentialEscalation(assessment.getPotentialEscalation())
                .publicSafetyImpact(assessment.getPublicSafetyImpact())
                .infrastructureImpact(assessment.getInfrastructureImpact())
                .environmentalImpact(assessment.getEnvironmentalImpact())
                .accessibilityImpact(assessment.getAccessibilityImpact())
                .reasoning(assessment.getReasoning())
                .recommendations(assessment.getRecommendations())
                .createdAt(assessment.getCreatedAt())
                .updatedAt(assessment.getUpdatedAt())
                // Injected joined incident attributes
                .incidentTitle(incident != null ? incident.getTitle() : "N/A")
                .incidentCategory(incident != null && incident.getCategory() != null ? incident.getCategory().name() : "OTHER")
                .incidentImageUrl(incident != null ? incident.getImageUrl() : null)
                .incidentAddress(incident != null && incident.getLocation() != null ? incident.getLocation().getAddress() : "N/A")
                .build();
    }
}
