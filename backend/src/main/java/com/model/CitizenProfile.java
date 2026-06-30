package com.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Gamification profile and operational statistics for a citizen.
 * Maps directly to documents in the Firestore 'citizen_profiles' collection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CitizenProfile {
    private String userId;
    private String name;
    private String avatarUrl;
    private String bio;
    private String coverImageUrl;
    private String city;
    private String state;
    private String country;
    private Integer points;
    private String level; // Calculated dynamically from points (e.g. "Active Citizen")
    private Integer rank;  // Calculated dynamically relative to other profiles
    private Integer reportsSubmitted;
    private Integer reportsResolved;
    private List<String> unlockedAchievements; // Array of unlocked Achievement IDs
    private List<String> savedIncidents; // Bookmarked reports
    private Long updatedAt;
}
