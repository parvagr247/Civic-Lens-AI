package com.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Audit log entry mapping citizen and admin operational actions.
 * Maps to documents in the Firestore 'activity_logs' collection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLog {
    private String id;
    private String userId;
    private String action; // e.g. "REPORT_FILED", "TICKET_RESOLVED", "ACHIEVEMENT_UNLOCKED"
    private String description;
    private Long timestamp;
}
