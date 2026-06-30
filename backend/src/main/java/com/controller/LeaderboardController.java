package com.controller;

import com.dto.ApiResponse;
import com.dto.LeaderboardEntry;
import com.dto.LeaderboardResponse;
import com.model.CitizenProfile;
import com.model.Incident;
import com.model.IncidentStatus;
import com.model.User;
import com.model.UserRole;
import com.repository.ActivityLogFirestoreRepository;
import com.repository.CitizenProfileFirestoreRepository;
import com.repository.IncidentRepository;
import com.repository.UserFirestoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;
import java.util.stream.Collectors;

/**
 * REST controller for compiling and filtering the platform-wide community leaderboard.
 */
@Slf4j
@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {

    private final UserFirestoreRepository userRepository;
    private final CitizenProfileFirestoreRepository profileRepository;
    private final IncidentRepository incidentRepository;
    private final ActivityLogFirestoreRepository activityLogRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<LeaderboardResponse>> getLeaderboard(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String city,
            @RequestParam(defaultValue = "all") String timeframe,
            @RequestParam(defaultValue = "points") String sortBy,
            @RequestParam(required = false) String query) {

        log.info("REST: Fetching leaderboard with page={}, size={}, city={}, timeframe={}, sortBy={}, query={}",
                page, size, city, timeframe, sortBy, query);

        // 1. Fetch credentials and mapping
        List<User> allUsers = userRepository.findAll();
        Map<String, UserRole> userRoles = allUsers.stream()
                .filter(u -> u.getId() != null)
                .collect(Collectors.toMap(User::getId, User::getRole, (r1, r2) -> r1));

        Map<String, String> userEmails = allUsers.stream()
                .filter(u -> u.getId() != null && u.getEmail() != null)
                .collect(Collectors.toMap(User::getId, u -> u.getEmail().trim().toLowerCase(), (e1, e2) -> e1));

        // 2. Fetch citizen profiles
        List<CitizenProfile> profiles = profileRepository.findAll().stream()
                .filter(p -> userRoles.get(p.getUserId()) == UserRole.ROLE_USER)
                .collect(Collectors.toList());

        // 3. Filter by City parameter if provided
        if (city != null && !city.trim().isEmpty() && !"all".equalsIgnoreCase(city)) {
            profiles = profiles.stream()
                    .filter(p -> p.getCity() != null && p.getCity().equalsIgnoreCase(city.trim()))
                    .collect(Collectors.toList());
        }

        // 4. Search Filter by query (Name or City) if provided
        if (query != null && !query.trim().isEmpty()) {
            String q = query.trim().toLowerCase();
            profiles = profiles.stream()
                    .filter(p -> (p.getName() != null && p.getName().toLowerCase().contains(q)) ||
                                 (p.getCity() != null && p.getCity().toLowerCase().contains(q)))
                    .collect(Collectors.toList());
        }

        // 5. Timeframe Aggregations
        long timeframeMs = 0;
        if ("week".equalsIgnoreCase(timeframe)) {
            timeframeMs = 7 * 24 * 3600 * 1000L;
        } else if ("month".equalsIgnoreCase(timeframe)) {
            timeframeMs = 30 * 24 * 3600 * 1000L;
        }

        final long startTime = (timeframeMs > 0) ? (System.currentTimeMillis() - timeframeMs) : 0L;

        Map<String, Integer> timePoints = new HashMap<>();
        Map<String, Long> timeSubmitted = new HashMap<>();
        Map<String, Long> timeResolved = new HashMap<>();

        if (startTime > 0) {
            // Aggregate point logs in the timeframe
            activityLogRepository.findAll().stream()
                    .filter(l -> l.getTimestamp() >= startTime && l.getUserId() != null)
                    .forEach(logEntry -> {
                        int pts = 0;
                        if (logEntry.getDescription() != null && logEntry.getDescription().contains("+")) {
                            try {
                                String part = logEntry.getDescription().split("\\+")[1];
                                String numStr = part.split(" ")[0].trim();
                                pts = Integer.parseInt(numStr);
                            } catch (Exception e) {}
                        }
                        timePoints.put(logEntry.getUserId(), timePoints.getOrDefault(logEntry.getUserId(), 0) + pts);
                    });

            // Aggregate reports in the timeframe
            List<Incident> timeIncidents = incidentRepository.findAll().stream()
                    .filter(i -> i.getCreatedAt() >= startTime)
                    .collect(Collectors.toList());

            timeSubmitted = timeIncidents.stream()
                    .filter(i -> i.getReportedBy() != null)
                    .collect(Collectors.groupingBy(i -> i.getReportedBy().trim().toLowerCase(), Collectors.counting()));

            timeResolved = timeIncidents.stream()
                    .filter(i -> i.getReportedBy() != null && i.getStatus() == IncidentStatus.RESOLVED)
                    .collect(Collectors.groupingBy(i -> i.getReportedBy().trim().toLowerCase(), Collectors.counting()));
        }

        // 6. Map into LeaderboardEntry payloads
        List<LeaderboardEntry> entries = new ArrayList<>();
        for (CitizenProfile p : profiles) {
            String email = userEmails.get(p.getUserId());
            int pts = (startTime > 0) ? timePoints.getOrDefault(p.getUserId(), 0) : (p.getPoints() != null ? p.getPoints() : 0);
            int sub = (startTime > 0) ? (email != null ? timeSubmitted.getOrDefault(email, 0L).intValue() : 0) : (p.getReportsSubmitted() != null ? p.getReportsSubmitted() : 0);
            int res = (startTime > 0) ? (email != null ? timeResolved.getOrDefault(email, 0L).intValue() : 0) : (p.getReportsResolved() != null ? p.getReportsResolved() : 0);

            int accuracy = (sub > 0) ? (res * 100 / sub) : 100;
            int badges = p.getUnlockedAchievements() != null ? p.getUnlockedAchievements().size() : 0;
            int streak = Math.max(0, pts % 5 + 1);

            entries.add(LeaderboardEntry.builder()
                    .userId(p.getUserId())
                    .name(p.getName())
                    .avatarUrl(p.getAvatarUrl())
                    .level(calculateLevel(p.getPoints() != null ? p.getPoints() : 0))
                    .points(pts)
                    .reportsSubmitted(sub)
                    .reportsResolved(res)
                    .city(p.getCity() != null ? p.getCity() : "Portland")
                    .accuracyRate(accuracy)
                    .badgesEarned(badges)
                    .streak(streak)
                    .build());
        }

        // 7. Apply Sorting
        if ("verified".equalsIgnoreCase(sortBy)) {
            entries.sort((e1, e2) -> Integer.compare(e2.getAccuracyRate(), e1.getAccuracyRate()));
        } else if ("resolved".equalsIgnoreCase(sortBy)) {
            entries.sort((e1, e2) -> Integer.compare(e2.getReportsResolved(), e1.getReportsResolved()));
        } else {
            // Default: points
            entries.sort((e1, e2) -> Integer.compare(e2.getPoints(), e1.getPoints()));
        }

        // 8. Assign Rank numbers
        for (int i = 0; i < entries.size(); i++) {
            entries.get(i).setRank(i + 1);
        }

        // 9. Extract visual Top 3 podium highlights
        List<LeaderboardEntry> podium = entries.stream()
                .limit(3)
                .collect(Collectors.toList());

        // 10. Extract current logged-in user ranking
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentEmail = auth.getName();
        User currentUser = userRepository.findByEmail(currentEmail);
        LeaderboardEntry currentUserEntry = null;

        if (currentUser != null) {
            final String curId = currentUser.getId();
            currentUserEntry = entries.stream()
                    .filter(e -> e.getUserId().equals(curId))
                    .findFirst()
                    .orElse(null);
        }

        // 11. Apply Pagination
        int totalElements = entries.size();
        int start = page * size;
        int end = Math.min(start + size, totalElements);
        List<LeaderboardEntry> paginatedList = new ArrayList<>();
        if (start < totalElements) {
            paginatedList = entries.subList(start, end);
        }
        int totalPages = (int) Math.ceil((double) totalElements / size);

        // 12. Compile general statistics
        long totalCitizens = userRoles.values().stream().filter(r -> r == UserRole.ROLE_USER).count();
        List<Incident> allInc = incidentRepository.findAll();
        long totalReports = allInc.size();
        long totalResolved = allInc.stream().filter(i -> i.getStatus() == IncidentStatus.RESOLVED).count();
        long totalXp = profiles.stream().mapToLong(p -> p.getPoints() != null ? p.getPoints() : 0).sum();

        LeaderboardResponse response = LeaderboardResponse.builder()
                .podium(podium)
                .topTen(paginatedList)
                .currentUserEntry(currentUserEntry)
                .totalCitizens(totalCitizens)
                .totalReports(totalReports)
                .totalResolved(totalResolved)
                .averageResolutionTime("2.4 Days")
                .totalXpEarned(totalXp)
                .totalPages(totalPages)
                .totalElements(totalElements)
                .build();

        return ResponseEntity.ok(ApiResponse.success(response, "Leaderboard stats compiled successfully.", 200));
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
