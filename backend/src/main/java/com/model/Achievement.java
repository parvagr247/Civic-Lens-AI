package com.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Reusable system achievement profile describing unlock requirements and rewards.
 * Maps to documents in the Firestore 'achievements' collection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Achievement {
    private String id;
    private String title;
    private String description;
    private String icon; // Name of Lucide icon used on frontend (e.g. "ShieldAlert")
    private Integer pointsAwarded;
    private String badge; // Badge visual classification group
}
