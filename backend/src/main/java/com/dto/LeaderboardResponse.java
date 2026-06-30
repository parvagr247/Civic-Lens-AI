package com.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * Payload envelope containing the paginated community leaderboard, top podium highlights,
 * personal ranking highlight, and aggregated city metrics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardResponse {
    private List<LeaderboardEntry> podium;
    private List<LeaderboardEntry> topTen;
    private LeaderboardEntry currentUserEntry;
    private long totalCitizens;
    private long totalReports;
    private long totalResolved;
    private String averageResolutionTime;
    private long totalXpEarned;
    private int totalPages;
    private long totalElements;
}
