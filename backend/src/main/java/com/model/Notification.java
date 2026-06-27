package com.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Platform notifications capturing system highlights.
 * Maps directly to documents in the Firestore 'notifications' collection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    private String id;
    private String recipientId; // Target User ID
    private String senderName;  // Display name of user triggering it (e.g. Sam or Municipality)
    private String type;        // LIKE, COMMENT, ASSIGNMENT, RESOLUTION, ACHIEVEMENT, ANNOUNCEMENT
    private String message;
    private String referenceId; // Associated Incident or entity ID
    private Boolean read;       // Status flag
    private Long createdAt;
}
