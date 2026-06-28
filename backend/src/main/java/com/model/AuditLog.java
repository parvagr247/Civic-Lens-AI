package com.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity logging administrator parameter overrides and community moderation actions.
 * Maps directly to documents in the Firestore 'audit_logs' collection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {
    private String id;
    private String incidentId;
    private String actorEmail;
    private String action; // e.g. OVERRIDE_PRIORITY, DELETED_COMMENT, HIDDEN_POST
    private String previousValue;
    private String newValue;
    private Long timestamp;
}
