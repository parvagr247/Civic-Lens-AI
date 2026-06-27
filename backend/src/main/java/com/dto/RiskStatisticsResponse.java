package com.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * DTO detailing aggregated risk statistics for municipal dispatch dashboards.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskStatisticsResponse {
    private Double averageRiskScore;
    private Integer highestRiskScore;
    private Long totalAssessedCount;
    private Long criticalThreatCount;
    private Long highThreatCount;
    private Long mediumThreatCount;
    private Long lowThreatCount;
    private Map<String, Long> priorityDistribution;
    private Map<String, Long> severityDistribution;
}
