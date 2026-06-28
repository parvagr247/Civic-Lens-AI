package com.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Task dispatch assignment connecting field officers to civic incidents.
 * Maps directly to documents in the Firestore 'assignments' collection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Assignment {
    private String id;
    private String incidentId;
    private String officerId;
    private String officerName;
    private Long assignedAt;
    private Long deadline; // Timestamp
    private String priority; // P1, P2, P3, P4
    private String instructions;
    private String status; // ASSIGNED, ACCEPTED, REJECTED, IN_PROGRESS, COMPLETED
    private String internalNotes;
    private String completionImageUrl;
    private String completionReport;
    private Long completedAt;
    private Boolean escalated;
    private Long updatedAt;
}
