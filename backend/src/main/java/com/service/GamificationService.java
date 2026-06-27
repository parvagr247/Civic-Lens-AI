package com.service;

/**
 * Service interface governing gamification logic, point allocation rules, level tiers, and achievement unlocks.
 */
public interface GamificationService {

    /**
     * Allocates points to a citizen for performing civic actions and updates their level.
     *
     * @param userId Unique citizen User ID.
     * @param action Action code (e.g. "REPORT_FILED", "ISSUE_RESOLVED").
     * @param referenceId Reference incident or entity ID.
     */
    void rewardPoints(String userId, String action, String referenceId);

    /**
     * Evaluates a citizen's contribution history to unlock matching achievements.
     *
     * @param userId Unique citizen User ID.
     */
    void processAchievementChecks(String userId);

    /**
     * Determines user level tier title based on cumulative point score.
     *
     * @param points Cumulative points.
     * @return Level tier title string.
     */
    String calculateLevel(int points);
}
