package com.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Model representing AI recommended dispatch details for a reported incident.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispatchRecommendation {
    private String id;
    private String incidentId;
    private String recommendedDepartment;
    private String recommendedOfficerId;
    private String recommendedOfficerName;
    private String priority; // P1, P2, P3
    private Long estimatedHours;
    private String reasoning;
    private Double confidence;
}
