package com.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Model representing automated priority adjustments or reassignment alerts logged by the SLA Escalation Engine.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EscalationLog {
    private String id;
    private String assignmentId;
    private String incidentId;
    private String triggerReason; // DEADLINE_MISSED, OFFICER_INACTIVE
    private String actionTaken;   // PRIORITY_BUMPED, REASSIGNMENT_RECOMMENDED
    private Long escalatedAt;
}
