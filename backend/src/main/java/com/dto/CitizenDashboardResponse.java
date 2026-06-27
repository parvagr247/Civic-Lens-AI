package com.dto;

import com.model.Achievement;
import com.model.ActivityLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Aggregated dashboard response package for Citizens.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CitizenDashboardResponse {
    private String name;
    private String avatarUrl;
    private String bio;
    private Integer points;
    private String level;
    private Integer rank;
    private Integer reportsSubmitted;
    private Integer reportsResolved;

    private List<IncidentResponse> recentReports;
    private List<IncidentResponse> nearbyIssues;
    private List<LeaderboardEntry> leaderboardPreview;
    private List<Achievement> achievementsPreview;
    private List<ActivityLog> activityTimeline;
    private Map<String, Integer> weeklyActivity; // Map of dayOfWeek -> count
    private Map<String, Integer> monthlyActivity; // Map of monthName -> count
}
