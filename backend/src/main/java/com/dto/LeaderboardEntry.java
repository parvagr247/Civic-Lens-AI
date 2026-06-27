package com.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Standardized leaderboard ranking entry payload.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardEntry {
    private String userId;
    private String name;
    private String avatarUrl;
    private String level;
    private Integer points;
    private Integer rank;
    private Integer reportsSubmitted;
    private Integer reportsResolved;
}
