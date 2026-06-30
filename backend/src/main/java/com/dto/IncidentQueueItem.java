package com.dto;

import com.model.IncidentStatus;
import com.model.IssueCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * High-performance lightweight projection DTO for listing incidents in tabular logs.
 * Avoids nested arrays, comment trails, and binary image representations.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentQueueItem {
    private String id;
    private String title;
    private IncidentStatus status;
    private IssueCategory category;
    private String priority;
    private String location;
    private String reportedBy;
    private String assignedDepartment;
    private String assignedOfficer;
    private Integer riskScore;
    private Double aiConfidence;
    private Boolean hidden;
    private Boolean pinned;
    private Boolean locked;
    private Boolean escalated;
    private Double spamScore;
    private String moderator;
    private Long createdAt;
    private Long updatedAt;
}
