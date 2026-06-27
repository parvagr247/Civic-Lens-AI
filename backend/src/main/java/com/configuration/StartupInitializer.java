package com.configuration;

import com.model.Achievement;
import com.repository.AchievementFirestoreRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Initializes and seeds default gamification metadata configurations into Firestore on startup if empty.
 */
@Slf4j
@Component
public class StartupInitializer implements CommandLineRunner {

    private final AchievementFirestoreRepository achievementRepository;

    public StartupInitializer(AchievementFirestoreRepository achievementRepository) {
        this.achievementRepository = achievementRepository;
    }

    @Override
    public void run(String... args) {
        log.info("Startup: Auditing system achievements configurations...");
        try {
            if (achievementRepository.findAll().isEmpty()) {
                log.info("Startup: Seeding default achievement badges into Firestore...");

                achievementRepository.save(Achievement.builder()
                        .id("first_report")
                        .title("First Responder")
                        .description("Filed your very first civic issue report.")
                        .icon("FileUp")
                        .pointsAwarded(10)
                        .badge("Bronze")
                        .build());

                achievementRepository.save(Achievement.builder()
                        .id("five_reports")
                        .title("Civic Patrol")
                        .description("Filed 5 reports helping track municipal issues.")
                        .icon("Award")
                        .pointsAwarded(30)
                        .badge("Silver")
                        .build());

                achievementRepository.save(Achievement.builder()
                        .id("first_resolved")
                        .title("Hazard Solved")
                        .description("First filed issue successfully resolved by public works dispatchers.")
                        .icon("CheckCircle")
                        .pointsAwarded(40)
                        .badge("Silver")
                        .build());

                achievementRepository.save(Achievement.builder()
                        .id("safety_hero")
                        .title("Safety Sentinel")
                        .description("Accumulated 100 points auditing city base courses.")
                        .icon("ShieldAlert")
                        .pointsAwarded(50)
                        .badge("Gold")
                        .build());

                log.info("Startup: Default achievements initialized successfully.");
            } else {
                log.info("Startup: Achievements database is up to date.");
            }
        } catch (Exception e) {
            log.error("Startup Warning: Failed to seed default configurations", e);
        }
    }
}
