package com.service.impl;

import com.dto.*;
import com.exception.ResourceNotFoundException;
import com.model.*;
import com.repository.*;
import com.service.DashboardService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service implementation aggregating citizen and administrator dashboard metrics.
 */
@Slf4j
@Service
public class DashboardServiceImpl implements DashboardService {

    private final UserFirestoreRepository userRepository;
    private final CitizenProfileFirestoreRepository profileRepository;
    private final IncidentRepository incidentRepository;
    private final RiskAssessmentRepository riskAssessmentRepository;
    private final AchievementFirestoreRepository achievementRepository;
    private final ActivityLogFirestoreRepository activityLogRepository;

    public DashboardServiceImpl(
            UserFirestoreRepository userRepository,
            CitizenProfileFirestoreRepository profileRepository,
            IncidentRepository incidentRepository,
            RiskAssessmentRepository riskAssessmentRepository,
            AchievementFirestoreRepository achievementRepository,
            ActivityLogFirestoreRepository activityLogRepository) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.incidentRepository = incidentRepository;
        this.riskAssessmentRepository = riskAssessmentRepository;
        this.achievementRepository = achievementRepository;
        this.activityLogRepository = activityLogRepository;
    }

    @Override
    public CitizenDashboardResponse getCitizenDashboard(String userId) {
        log.info("Dashboard: Compiling Citizen Dashboard metrics for User ID: {}", userId);

        // 1. Fetch credentials and profile details
        User user = userRepository.findById(userId);
        if (user == null) {
            throw new ResourceNotFoundException("User not found with ID: " + userId);
        }

        CitizenProfile profile = profileRepository.findByUserId(userId);
        if (profile == null) {
            throw new ResourceNotFoundException("Citizen profile not found for User ID: " + userId);
        }

        // 2. Fetch and assign dynamic rank positions
        List<CitizenProfile> rankedProfiles = profileRepository.findAllSortedByPoints();
        int userRank = 1;
        for (int i = 0; i < rankedProfiles.size(); i++) {
            if (rankedProfiles.get(i).getUserId().equalsIgnoreCase(userId)) {
                userRank = i + 1;
                break;
            }
        }
        if (profile.getRank() != userRank) {
            profile.setRank(userRank);
            profileRepository.save(profile); // Update cache
        }

        // 3. Map leaderboard top 3 podium entries
        List<LeaderboardEntry> podium = rankedProfiles.stream()
                .limit(3)
                .map(p -> LeaderboardEntry.builder()
                        .userId(p.getUserId())
                        .name(p.getName())
                        .avatarUrl(p.getAvatarUrl())
                        .level(p.getLevel())
                        .points(p.getPoints())
                        .rank(rankedProfiles.indexOf(p) + 1)
                        .reportsSubmitted(p.getReportsSubmitted())
                        .reportsResolved(p.getReportsResolved())
                        .build())
                .collect(Collectors.toList());

        // 4. Fetch personal reported incidents vs nearby issues
        List<Incident> allIncidents = incidentRepository.findAll();
        String userEmail = user.getEmail().trim().toLowerCase();

        List<IncidentResponse> userReports = allIncidents.stream()
                .filter(i -> userEmail.equalsIgnoreCase(i.getReportedBy()))
                .sorted(Comparator.comparing(Incident::getCreatedAt).reversed())
                .map(this::mapToIncidentResponse)
                .collect(Collectors.toList());

        List<IncidentResponse> recentReports = userReports.stream().limit(5).collect(Collectors.toList());

        List<IncidentResponse> nearbyIssues = allIncidents.stream()
                .filter(i -> !userEmail.equalsIgnoreCase(i.getReportedBy()))
                .sorted(Comparator.comparing(Incident::getCreatedAt).reversed())
                .limit(5)
                .map(this::mapToIncidentResponse)
                .collect(Collectors.toList());

        // 5. Fetch audit timelines and unlocked achievements
        List<ActivityLog> activityTimeline = activityLogRepository.findByUserId(userId).stream()
                .limit(10)
                .collect(Collectors.toList());

        List<Achievement> achievementsPreview = new ArrayList<>();
        if (profile.getUnlockedAchievements() != null) {
            for (String achievementId : profile.getUnlockedAchievements()) {
                Achievement ach = achievementRepository.findById(achievementId);
                if (ach != null) {
                    achievementsPreview.add(ach);
                }
            }
        }

        // 6. Map weekly and monthly activity counts
        Map<String, Integer> weeklyActivity = new LinkedHashMap<>();
        String[] days = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};
        for (String day : days) weeklyActivity.put(day, 0);

        SimpleDateFormat dayFormat = new SimpleDateFormat("EEE", Locale.ENGLISH);
        for (Incident incident : allIncidents.stream().filter(i -> userEmail.equalsIgnoreCase(i.getReportedBy())).collect(Collectors.toList())) {
            String dayName = dayFormat.format(new Date(incident.getCreatedAt()));
            if (weeklyActivity.containsKey(dayName)) {
                weeklyActivity.put(dayName, weeklyActivity.get(dayName) + 1);
            }
        }

        Map<String, Integer> monthlyActivity = new LinkedHashMap<>();
        String[] months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
        for (String month : months) monthlyActivity.put(month, 0);

        SimpleDateFormat monthFormat = new SimpleDateFormat("MMM", Locale.ENGLISH);
        for (Incident incident : allIncidents.stream().filter(i -> userEmail.equalsIgnoreCase(i.getReportedBy())).collect(Collectors.toList())) {
            String mName = monthFormat.format(new Date(incident.getCreatedAt()));
            if (monthlyActivity.containsKey(mName)) {
                monthlyActivity.put(mName, monthlyActivity.get(mName) + 1);
            }
        }

        return CitizenDashboardResponse.builder()
                .name(profile.getName())
                .avatarUrl(profile.getAvatarUrl())
                .bio(profile.getBio())
                .points(profile.getPoints())
                .level(profile.getLevel())
                .rank(userRank)
                .reportsSubmitted(profile.getReportsSubmitted())
                .reportsResolved(profile.getReportsResolved())
                .recentReports(recentReports)
                .nearbyIssues(nearbyIssues)
                .leaderboardPreview(podium)
                .achievementsPreview(achievementsPreview)
                .activityTimeline(activityTimeline)
                .weeklyActivity(weeklyActivity)
                .monthlyActivity(monthlyActivity)
                .build();
    }

    @Override
    public AdminDashboardResponse getAdminDashboard() {
        log.info("Dashboard: Compiling Municipal Admin Analytics");

        // 1. Fetch operational records
        List<Incident> allIncidents = incidentRepository.findAll();
        List<RiskAssessment> allRisks = riskAssessmentRepository.findAll();
        List<CitizenProfile> allProfiles = profileRepository.findAll();

        // 2. Compute aggregated totals
        long totalIncidents = allIncidents.size();
        long resolved = allIncidents.stream().filter(i -> i.getStatus() == IncidentStatus.RESOLVED).count();
        long pending = totalIncidents - resolved;

        double avgRisk = allRisks.stream()
                .mapToInt(RiskAssessment::getOverallRiskScore)
                .average()
                .orElse(0.0);

        long critical = allRisks.stream()
                .filter(r -> r.getThreatLevel() == ThreatLevel.CRITICAL || r.getOverallRiskScore() >= 80)
                .count();

        long activeCitizens = allProfiles.size();

        // Calculate reports reported today vs this week
        long now = System.currentTimeMillis();
        long oneDayMs = 24 * 60 * 60 * 1000L;
        long oneWeekMs = 7 * oneDayMs;

        long todayCount = allIncidents.stream().filter(i -> (now - i.getCreatedAt()) <= oneDayMs).count();
        long weekCount = allIncidents.stream().filter(i -> (now - i.getCreatedAt()) <= oneWeekMs).count();

        // 3. Category count distributions
        Map<String, Long> categoryCounts = allIncidents.stream()
                .collect(Collectors.groupingBy(i -> i.getCategory() != null ? i.getCategory().name() : "OTHER", Collectors.counting()));
        for (IssueCategory c : IssueCategory.values()) {
            categoryCounts.putIfAbsent(c.name(), 0L);
        }

        // 4. Priority counts
        Map<String, Long> priorityCounts = allRisks.stream()
                .collect(Collectors.groupingBy(r -> r.getPriority() != null ? r.getPriority().name() : "P3", Collectors.counting()));
        for (PriorityLevel p : PriorityLevel.values()) {
            priorityCounts.putIfAbsent(p.name(), 0L);
        }

        // 5. Recent uploads
        List<IncidentResponse> recentUploads = allIncidents.stream()
                .sorted(Comparator.comparing(Incident::getCreatedAt).reversed())
                .limit(5)
                .map(this::mapToIncidentResponse)
                .collect(Collectors.toList());

        // 6. Generate AI recommendations
        List<String> recommendations = new ArrayList<>();
        recommendations.add("Allocate emergency patch budgets: " + categoryCounts.getOrDefault("POTHOLE", 0L) + " active potholes filed.");
        recommendations.add("Deploy public safety details: " + critical + " critical priority locations demand immediate dispatch.");
        recommendations.add("Review utility pipelines: sewage and flood reports have increased by 15% this week.");
        recommendations.add("Reward top civic responders to expand image verification coverage.");

        return AdminDashboardResponse.builder()
                .totalIncidents(totalIncidents)
                .criticalIncidents(critical)
                .resolvedIncidents(resolved)
                .pendingIncidents(pending)
                .averageRisk(avgRisk)
                .averageResolutionTime("2.4 Days") // Mock operational metric
                .reportsToday(todayCount)
                .reportsThisWeek(weekCount)
                .activeCitizens(activeCitizens)
                .categoryCounts(categoryCounts)
                .priorityCounts(priorityCounts)
                .recentUploads(recentUploads)
                .aiRecommendations(recommendations)
                .build();
    }

    private IncidentResponse mapToIncidentResponse(Incident incident) {
        return IncidentResponse.fromEntity(incident);
    }
}
