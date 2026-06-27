package com.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response payload mapping details of an incident's risk assessment.
 * Includes nested incident metadata fields for dashboard convenience.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskAssessmentResponse {
    private String id;
    private String incidentId;
    private Integer overallRiskScore;
    private String severity;
    private String urgency;
    private Double confidence;
    private String priority;
    private String threatLevel;
    private String estimatedResolutionTime;
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

    // Joined Incident Details for dashboard rendering
    private String incidentTitle;
    private String incidentCategory;
    private String incidentImageUrl;
    private String incidentAddress;
}
