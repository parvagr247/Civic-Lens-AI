package com.controller;

import com.dto.ApiResponse;
import com.model.*;
import com.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

/**
 * Development utility controller to seed high-fidelity realistic data.
 */
@Slf4j
@RestController
@RequestMapping("/api/dev")
@RequiredArgsConstructor
public class DevSeedController {

    private final IncidentRepository incidentRepository;
    private final OfficerFirestoreRepository officerRepository;
    private final CommentFirestoreRepository commentRepository;
    private final UserFirestoreRepository userRepository;
    private final AssignmentFirestoreRepository assignmentRepository;
    private final CitizenProfileFirestoreRepository profileRepository;

    @PostMapping("/seed")
    public ResponseEntity<ApiResponse<Map<String, Object>>> seedDatabase() {
        log.info("SEED: Triggering Dev Seeds Runner.");
        Map<String, Object> stats = new HashMap<>();

        // 1. Seed 8 Departments
        String[] departments = {
            "Public Works", "Sanitation", "Water Division", "Electrical Grid",
            "Parks & Recreation", "Traffic Control", "Housing Authority", "Environmental Health"
        };

        // 2. Seed 20 Officers
        List<Officer> createdOfficers = new ArrayList<>();
        for (int i = 1; i <= 20; i++) {
            String dept = departments[i % departments.length];
            String id = "officer-seed-" + i;
            Officer officer = Officer.builder()
                    .id(id)
                    .userId("user-officer-" + i)
                    .name("Officer " + getNamesList()[i % getNamesList().length])
                    .email("officer" + i + "@civiclens.gov")
                    .department(dept)
                    .active(true)
                    .performanceScore(3.5 + (i % 15) * 0.1)
                    .createdAt(System.currentTimeMillis() - (86400000L * i))
                    .build();
            officerRepository.save(officer);
            createdOfficers.add(officer);
        }
        stats.put("officersSeeded", createdOfficers.size());

        // 3. Seed 60 Citizens
        String[] mockCities = {"Portland", "Seattle", "Austin", "Denver", "Boston"};
        for (int i = 1; i <= 60; i++) {
            String id = "user-citizen-" + i;
            String name = "Citizen " + getNamesList()[i % getNamesList().length];
            User user = User.builder()
                    .id(id)
                    .email("citizen" + i + "@mail.com")
                    .role(com.model.UserRole.ROLE_USER)
                    .createdAt(System.currentTimeMillis() - (86400000L * i))
                    .build();
            userRepository.save(user);

            // Seed Profile
            int points = (60 - i) * 35 + 15;
            String level = calculateLevel(points);
            int submitted = (60 - i) / 2 + 2;
            int resolved = (60 - i) / 3 + 1;
            String city = mockCities[i % mockCities.length];

            CitizenProfile profile = CitizenProfile.builder()
                    .userId(id)
                    .name(name)
                    .avatarUrl("https://api.dicebear.com/7.x/bottts/svg?seed=citizen" + i)
                    .bio("Active citizen contributor based in " + city + ".")
                    .city(city)
                    .state(city.equals("Portland") ? "Oregon" : city.equals("Seattle") ? "Washington" : city.equals("Austin") ? "Texas" : city.equals("Denver") ? "Colorado" : "Massachusetts")
                    .country("United States")
                    .points(points)
                    .level(level)
                    .rank(i)
                    .reportsSubmitted(submitted)
                    .reportsResolved(resolved)
                    .unlockedAchievements(points >= 100 ? List.of("first_report", "five_reports", "safety_hero") : List.of("first_report"))
                    .savedIncidents(List.of())
                    .updatedAt(System.currentTimeMillis())
                    .build();
            profileRepository.save(profile);
        }
        stats.put("citizensSeeded", 60);

        // 4. Seed 150 Incidents
        List<Incident> createdIncidents = new ArrayList<>();
        String[] categories = {"ROADS", "SANITATION", "WATER", "ELECTRICAL", "PARKS", "TRAFFIC", "HOUSING", "ENVIRONMENT"};
        String[] descriptions = {
            "Large pothole reported in the middle lane causing alignment issues.",
            "Excessive trash accumulation near the public square entrance.",
            "Low water pressure and bubbling street main leaks.",
            "Damaged electrical transformer poles humming loudly.",
            "Overgrown weeds blocking pathways in the municipal gardens.",
            "Traffic light synchronization delay causing rush hour backlogs.",
            "Exposed electrical lines reported in the communal building basement.",
            "Noxious smoke odors coming from industrial yard perimeter."
        };

        for (int i = 1; i <= 150; i++) {
            String id = "incident-seed-" + i;
            String cat = categories[i % categories.length];
            String desc = descriptions[i % descriptions.length];
            
            // Generate coordinates centered around standard metropolitan coordinates (e.g. Portland: 45.5, -122.6)
            double lat = 45.51 + (Math.sin(i) * 0.05);
            double lon = -122.68 + (Math.cos(i) * 0.05);

            Incident incident = Incident.builder()
                    .id(id)
                    .title("Report: " + cat + " issue at segment " + i)
                    .description(desc + " Ref key: " + i)
                    .status(IncidentStatus.values()[i % IncidentStatus.values().length])
                    .category(IssueCategory.values()[i % IssueCategory.values().length])
                    .severity(SeverityLevel.values()[i % SeverityLevel.values().length])
                    .location(new GeoLocation(lat, lon, "Metropolitan sector " + i + ", City Grid"))
                    .reportedBy("citizen" + (i % 60 + 1) + "@mail.com")
                    .anonymous(i % 5 == 0)
                    .reopenCount(i % 10 == 0 ? 1 : 0)
                    .createdAt(System.currentTimeMillis() - (3600000L * i))
                    .updatedAt(System.currentTimeMillis() - (1800000L * i))
                    .build();
            incidentRepository.save(incident);
            createdIncidents.add(incident);

            // Optional: seed some dispatch assignments
            if (i % 3 == 0) {
                Officer assignedOff = createdOfficers.get(i % createdOfficers.size());
                String[] pList = {"P1", "P2", "P3"};
                String[] sList = {"ASSIGNED", "ACCEPTED", "IN_PROGRESS", "COMPLETED"};
                Assignment assignment = Assignment.builder()
                        .id("assignment-seed-" + i)
                        .incidentId(id)
                        .officerId(assignedOff.getId())
                        .officerName(assignedOff.getName())
                        .status(sList[i % sList.length])
                        .instructions("Standard inspection and resolution directive.")
                        .priority(pList[i % pList.length])
                        .deadline(System.currentTimeMillis() + 86400000L)
                        .completedAt(i % 6 == 0 ? System.currentTimeMillis() : null)
                        .build();
                assignmentRepository.save(assignment);
            }
        }
        stats.put("incidentsSeeded", createdIncidents.size());

        // 5. Seed 600 Comments & Likes
        int commentCount = 0;
        for (int i = 1; i <= 600; i++) {
            Incident targetInc = createdIncidents.get(i % createdIncidents.size());
            String commentId = "comment-seed-" + i;
            Comment comment = Comment.builder()
                    .id(commentId)
                    .incidentId(targetInc.getId())
                    .userId("user-citizen-" + (i % 60 + 1))
                    .userName("Citizen " + getNamesList()[i % getNamesList().length])
                    .content("Seeded validation commentary log entry number " + i)
                    .createdAt(System.currentTimeMillis() - (600000L * i))
                    .likesCount(i % 8)
                    .likedBy(new ArrayList<>())
                    .build();
            commentRepository.save(comment);
            commentCount++;
        }
        stats.put("commentsSeeded", commentCount);

        return ResponseEntity.ok(ApiResponse.success(stats, "All Dev Seed data populated successfully!", 200));
    }

    private String[] getNamesList() {
        return new String[]{
            "Alice", "Bob", "Charlie", "David", "Eve", "Franklin", "Grace", "Heidi",
            "Ivan", "Judy", "Mallory", "Niaj", "Olivia", "Peggy", "Rupert", "Sybil",
            "Trent", "Victor", "Walter", "Zoe"
        };
    }

    private String calculateLevel(int points) {
        if (points < 50) return "New Citizen";
        if (points < 150) return "Active Citizen";
        if (points < 300) return "Community Helper";
        if (points < 600) return "City Guardian";
        if (points < 1000) return "Urban Hero";
        if (points < 2000) return "AI Civic Ambassador";
        return "Smart City Champion";
    }
}
