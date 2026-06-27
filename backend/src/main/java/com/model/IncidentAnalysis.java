package com.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Domain entity representing the structured AI intelligence report for an incident.
 * Maps directly to documents in the Firestore 'incident_analysis' collection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentAnalysis {
    private String id;
    private String incidentId;
    private String summary;
    private List<String> observedDamages;
    private String likelyCause;
    private Double confidence;
    private String recommendedAction;
    private String reasoning;
    private Long analyzedAt;
}
