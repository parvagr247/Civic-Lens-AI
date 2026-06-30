package com.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Aggregated analytics dashboard response package for Municipal Admins.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardResponse {
    private Long totalIncidents;
    private Long criticalIncidents;
    private Long resolvedIncidents;
    private Long pendingIncidents;
    private Double averageRisk;
    private String averageResolutionTime;
    private Long reportsToday;
    private Long reportsThisWeek;
    private Long activeCitizens;

    private Map<String, Long> categoryCounts;
    private Map<String, Long> priorityCounts;
    private List<IncidentResponse> recentUploads;
    private List<String> aiRecommendations;

    private Long openIncidents;
    private Long awaitingAssignment;
    private Long assignedToday;
    private Long resolvedToday;
    private Double averageAiConfidence;
    private Map<String, Long> departmentWorkload;
    private String systemHealth;
    private List<String> emergencyAlerts;
    private List<String> recentActivityFeed;
}
