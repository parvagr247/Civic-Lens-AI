package com.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Domain entity representing the calculated Risk Assessment score card for a reported incident.
 * Maps directly to documents in the Firestore 'risk_assessments' collection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskAssessment {
    private String id;
    private String incidentId;
    private Integer overallRiskScore; // 0 to 100
    private RiskSeverity severity;
    private ResponseUrgency urgency;
    private Double confidence; // 0.0 to 1.0
    private PriorityLevel priority;
    private ThreatLevel threatLevel;
    private String estimatedResolutionTime; // e.g. "24 Hours", "5 Days"
    private Integer affectedPopulation;
    private List<String> affectedDepartments;
    private String potentialEscalation;
    private String publicSafetyImpact;
    private String infrastructureImpact;
    private String environmentalImpact;
    private String accessibilityImpact;
    private String reasoning;
    private List<String> recommendations;
    private Long createdAt;
    private Long updatedAt;
}
