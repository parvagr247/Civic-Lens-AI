package com.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Incident domain entity representing a reported municipal issue.
 * Maps directly to documents in the Firestore 'incidents' collection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Incident {
    private String id;
    private String title;
    private String description;
    private IncidentStatus status;
    private IssueCategory category;
    private SeverityLevel severity;
    private GeoLocation location;
    private String imageUrl;
    private String reportedBy; // Email of the citizen who filed the report
    private Boolean anonymous;
    private Long createdAt;
    private Long updatedAt;
}
