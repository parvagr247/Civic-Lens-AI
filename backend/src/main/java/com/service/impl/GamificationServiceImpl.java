package com.service.impl;

import com.model.Achievement;
import com.model.ActivityLog;
import com.model.CitizenProfile;
import com.repository.AchievementFirestoreRepository;
import com.repository.ActivityLogFirestoreRepository;
import com.repository.CitizenProfileFirestoreRepository;
import com.service.GamificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Service implementation managing points allocation, level calculations, and achievement milestones checking.
 */
@Slf4j
@Service
public class GamificationServiceImpl implements GamificationService {

    private final CitizenProfileFirestoreRepository profileRepository;
    private final AchievementFirestoreRepository achievementRepository;
    private final ActivityLogFirestoreRepository activityLogRepository;

    public GamificationServiceImpl(
            CitizenProfileFirestoreRepository profileRepository,
            AchievementFirestoreRepository achievementRepository,
            ActivityLogFirestoreRepository activityLogRepository) {
        this.profileRepository = profileRepository;
        this.achievementRepository = achievementRepository;
        this.activityLogRepository = activityLogRepository;
    }

    @Override
    public void rewardPoints(String userId, String action, String referenceId) {
        log.info("Gamification: Rewarding points for user {} - Action: {}", userId, action);

        CitizenProfile profile = profileRepository.findByUserId(userId);
        if (profile == null) {
            log.warn("Gamification: No citizen profile found for User ID: {}. Skipping point allocation.", userId);
            return;
        }

        // 1. Determine points to award
        int pointsToAward = 2; // Default fallback points (e.g. daily login)
        switch (action.toUpperCase()) {
            case "REPORT_FILED":
                pointsToAward = 10;
                profile.setReportsSubmitted(profile.getReportsSubmitted() + 1);
                break;
            case "IMAGE_VALIDATION":
                pointsToAward = 5;
                break;
            case "COMMUNITY_FEEDBACK":
                pointsToAward = 15;
                break;
            case "COMMUNITY_SUPPORT":
                pointsToAward = 5;
                break;
            case "ISSUE_RESOLVED":
                pointsToAward = 50;
                profile.setReportsResolved(profile.getReportsResolved() + 1);
                break;
            case "ACHIEVEMENT_UNLOCKED":
                // Points are passed as an overlay or custom amount.
                // We'll handle this separately.
                break;
        }

        // 2. Increment points
        int oldPoints = profile.getPoints();
        int newPoints = oldPoints + pointsToAward;
        profile.setPoints(newPoints);

        // 3. Recalculate level
        String oldLevel = profile.getLevel();
        String newLevel = calculateLevel(newPoints);
        profile.setLevel(newLevel);

        profile.setUpdatedAt(System.currentTimeMillis());
        profileRepository.save(profile);

        // 4. Log point allocation
        ActivityLog pointsLog = ActivityLog.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .action("POINTS_EARNED")
                .description("Earned +" + pointsToAward + " points for action: " + action.replace("_", " "))
                .timestamp(System.currentTimeMillis())
                .build();
        activityLogRepository.save(pointsLog);

        // 5. Log level up if tier changed
        if (!newLevel.equalsIgnoreCase(oldLevel)) {
            log.info("Gamification: User {} leveled up to '{}'", userId, newLevel);
            ActivityLog levelLog = ActivityLog.builder()
                    .id(UUID.randomUUID().toString())
                    .userId(userId)
                    .action("LEVEL_UP")
                    .description("Leveled up to tier: " + newLevel)
                    .timestamp(System.currentTimeMillis())
                    .build();
            activityLogRepository.save(levelLog);
        }

        // 6. Check if new milestone achievements are unlocked
        processAchievementChecks(userId);
    }

    @Override
    public void processAchievementChecks(String userId) {
        log.info("Gamification: Evaluating achievements milestones for user: {}", userId);
        CitizenProfile profile = profileRepository.findByUserId(userId);
        if (profile == null) return;

        List<String> unlocked = profile.getUnlockedAchievements();
        if (unlocked == null) {
            unlocked = new ArrayList<>();
            profile.setUnlockedAchievements(unlocked);
        }

        List<Achievement> systemAchievements = achievementRepository.findAll();
        boolean profileUpdated = false;

        for (Achievement achievement : systemAchievements) {
            String id = achievement.getId();
            if (unlocked.contains(id)) {
                continue; // Already unlocked
            }

            boolean shouldUnlock = false;
            switch (id) {
                case "first_report":
                    shouldUnlock = (profile.getReportsSubmitted() >= 1);
                    break;
                case "five_reports":
                    shouldUnlock = (profile.getReportsSubmitted() >= 5);
                    break;
                case "first_resolved":
                    shouldUnlock = (profile.getReportsResolved() >= 1);
                    break;
                case "safety_hero":
                    // Unlocks if user has reported an issue and has 100+ points
                    shouldUnlock = (profile.getReportsSubmitted() >= 1 && profile.getPoints() >= 100);
                    break;
            }

            if (shouldUnlock) {
                log.info("Gamification: Unlocking achievement '{}' for user: {}", id, userId);
                unlocked.add(id);
                
                // Directly reward achievement points
                profile.setPoints(profile.getPoints() + achievement.getPointsAwarded());
                profile.setLevel(calculateLevel(profile.getPoints()));
                profileUpdated = true;

                // Log audit activity for achievement unlock
                ActivityLog unlockLog = ActivityLog.builder()
                        .id(UUID.randomUUID().toString())
                        .userId(userId)
                        .action("ACHIEVEMENT_UNLOCKED")
                        .description("Unlocked achievement badge: " + achievement.getTitle())
                        .timestamp(System.currentTimeMillis())
                        .build();
                activityLogRepository.save(unlockLog);
            }
        }

        if (profileUpdated) {
            profile.setUpdatedAt(System.currentTimeMillis());
            profileRepository.save(profile);
        }
    }

    @Override
    public String calculateLevel(int points) {
        if (points < 50) return "New Citizen";
        if (points < 150) return "Active Citizen";
        if (points < 300) return "Community Helper";
        if (points < 600) return "City Guardian";
        if (points < 1000) return "Urban Hero";
        if (points < 2000) return "AI Civic Ambassador";
        return "Smart City Champion";
    }
}
