package com.dto;

import com.model.IncidentAnalysis;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO returning the details of an AI intelligence analysis report.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisResponse {
    private String id;
    private String incidentId;
    private String summary;
    private List<String> observedDamages;
    private String likelyCause;
    private Double confidence;
    private String recommendedAction;
    private String reasoning;
    private Long analyzedAt;

    /**
     * Map from IncidentAnalysis domain model to AnalysisResponse DTO.
     */
    public static AnalysisResponse fromEntity(IncidentAnalysis analysis) {
        if (analysis == null) {
            return null;
        }
        return AnalysisResponse.builder()
                .id(analysis.getId())
                .incidentId(analysis.getIncidentId())
                .summary(analysis.getSummary())
                .observedDamages(analysis.getObservedDamages())
                .likelyCause(analysis.getLikelyCause())
                .confidence(analysis.getConfidence())
                .recommendedAction(analysis.getRecommendedAction())
                .reasoning(analysis.getReasoning())
                .analyzedAt(analysis.getAnalyzedAt())
                .build();
    }
}
