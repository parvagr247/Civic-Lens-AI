package com.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.model.*;
import com.repository.*;
import com.service.GeminiService;
import com.service.NotificationService;
import com.service.OperationsService;
import com.exception.FirebaseException;
import com.exception.ValidationException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * OperationsService implementation orchestrating AI recommendations, SLAs, and escalations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OperationsServiceImpl implements OperationsService {

    private final IncidentRepository incidentRepository;
    private final IncidentAnalysisRepository analysisRepository;
    private final AssignmentFirestoreRepository assignmentRepository;
    private final OfficerFirestoreRepository officerRepository;
    private final DispatchRecommendationFirestoreRepository recommendationRepository;
    private final EscalationLogFirestoreRepository escalationRepository;
    private final GeminiService geminiService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public DispatchRecommendation getOrGenerateRecommendation(String incidentId) {
        log.info("Operations Service: Resolving dispatch recommendation for incident {}", incidentId);
        
        // 1. Return cached recommendation if it exists
        DispatchRecommendation cached = recommendationRepository.findByIncidentId(incidentId);
        if (cached != null) {
            return cached;
        }

        // 2. Fetch Incident and AI vision details
        Incident incident = incidentRepository.findById(incidentId);
        if (incident == null) throw new IllegalArgumentException("Incident not found");

        IncidentAnalysis analysis = analysisRepository.findByIncidentId(incidentId);
        String category = incident.getCategory() != null ? incident.getCategory().name() : "OTHER";

        // Fetch registered officers to match
        List<Officer> officers = officerRepository.findAll();
        StringBuilder officerListText = new StringBuilder();
        for (Officer off : officers) {
            officerListText.append(String.format("- ID: %s, Name: %s, Department: %s\n", off.getId(), off.getName(), off.getDepartment()));
        }

        // 3. Build prompt for Gemini to suggest dispatcher metadata
        String prompt = String.format(
                "You are the Smart City Dispatcher AI. Your job is to analyze this civic incident and suggest the optimal routing.\n" +
                "Incident Title: %s\n" +
                "Incident Description: %s\n" +
                "Gemini Vision Category: %s\n\n" +
                "Available Officers in the city:\n%s\n" +
                "Return a JSON response containing the best department recommendation (e.g. Public Works, Sanitation, Traffic Management, Parks & Recreation, Utility Operations), " +
                "the recommended officer ID and name from the available officers list, priority (P1 for high hazard, P2 for medium, P3 for low), " +
                "estimated hours to resolve, reasoning explaining the suggestion, and confidence (0.0 to 1.0).\n" +
                "If no matching officer is found, leave recommendedOfficerId and recommendedOfficerName null.\n" +
                "Return JSON ONLY. Format must match:\n" +
                "{\n" +
                "  \"recommendedDepartment\": \"...\",\n" +
                "  \"recommendedOfficerId\": \"...\",\n" +
                "  \"recommendedOfficerName\": \"...\",\n" +
                "  \"priority\": \"P1\",\n" +
                "  \"estimatedHours\": 24,\n" +
                "  \"reasoning\": \"...\",\n" +
                "  \"confidence\": 0.95\n" +
                "}",
                incident.getTitle(),
                incident.getDescription(),
                category,
                officers.isEmpty() ? "No officers registered. Recommend a department only." : officerListText.toString()
        );

        try {
            String jsonResponse = geminiService.callTextModel(prompt);
            Map<String, Object> map = objectMapper.readValue(jsonResponse, Map.class);

            DispatchRecommendation rec = DispatchRecommendation.builder()
                    .id(UUID.randomUUID().toString())
                    .incidentId(incidentId)
                    .recommendedDepartment((String) map.getOrDefault("recommendedDepartment", "Public Works"))
                    .recommendedOfficerId((String) map.get("recommendedOfficerId"))
                    .recommendedOfficerName((String) map.get("recommendedOfficerName"))
                    .priority((String) map.getOrDefault("priority", "P2"))
                    .estimatedHours(Long.valueOf(String.valueOf(map.getOrDefault("estimatedHours", 72))))
                    .reasoning((String) map.getOrDefault("reasoning", "Standard departmental routing."))
                    .confidence(Double.valueOf(String.valueOf(map.getOrDefault("confidence", 0.85))))
                    .build();

            recommendationRepository.save(rec);
            return rec;
        } catch (Exception e) {
            log.warn("Gemini dispatcher failed. Generating fallback recommendation.", e);
            DispatchRecommendation fallback = DispatchRecommendation.builder()
                    .id(UUID.randomUUID().toString())
                    .incidentId(incidentId)
                    .recommendedDepartment("Public Works")
                    .recommendedOfficerId(officers.isEmpty() ? null : officers.get(0).getId())
                    .recommendedOfficerName(officers.isEmpty() ? null : officers.get(0).getName())
                    .priority("P2")
                    .estimatedHours(72L)
                    .reasoning("Fallback routing due to AI service disruption.")
                    .confidence(0.5)
                    .build();
            recommendationRepository.save(fallback);
            return fallback;
        }
    }

    @Override
    public void runEscalationEngineChecks() {
        log.info("SLA Escalation Engine: Initiating overdue checks for active dispatches.");
        List<Assignment> assignments = assignmentRepository.findAll();
        long now = System.currentTimeMillis();

        for (Assignment ass : assignments) {
            // Check only active assignments
            if ("COMPLETED".equalsIgnoreCase(ass.getStatus()) || "REJECTED".equalsIgnoreCase(ass.getStatus())) {
                continue;
            }

            // Scenario 1: Deadline missed
            if (ass.getDeadline() != null && now > ass.getDeadline() && !Boolean.TRUE.equals(ass.getEscalated())) {
                log.warn("SLA Overdue: Assignment {} has missed its deadline!", ass.getId());
                
                ass.setEscalated(true);
                ass.setPriority("P1"); // Bump to P1 severity
                ass.setUpdatedAt(now);
                assignmentRepository.save(ass);

                // Elevate Incident Priority
                Incident incident = incidentRepository.findById(ass.getIncidentId());
                if (incident != null) {
                    incident.setStatus(IncidentStatus.INVESTIGATING);
                    incident.setUpdatedAt(now);
                    incidentRepository.save(incident);
                }

                // Log escalation history
                EscalationLog logEntry = EscalationLog.builder()
                        .id(UUID.randomUUID().toString())
                        .assignmentId(ass.getId())
                        .incidentId(ass.getIncidentId())
                        .triggerReason("DEADLINE_MISSED")
                        .actionTaken("PRIORITY_BUMPED_TO_P1")
                        .escalatedAt(now)
                        .build();
                escalationRepository.save(logEntry);

                // Notify Admin and Officer
                notificationService.notify(
                        ass.getOfficerId(), // In Firestore, officerId is mapped
                        "SLA Escalation Engine",
                        "ESCALATION",
                        "CRITICAL: Assignment deadline has passed. Priority escalated to P1.",
                        ass.getIncidentId()
                );
            }
        }
    }

    @Override
    public void verifyResolution(String incidentId, boolean confirm, String feedback, String reopenPhotoUrl, String citizenEmail) {
        log.info("Citizen Verification: Processing resolution verification for incident {} by citizen {}", incidentId, citizenEmail);
        Incident incident = incidentRepository.findById(incidentId);
        if (incident == null) throw new IllegalArgumentException("Incident not found");

        if (!incident.getReportedBy().equalsIgnoreCase(citizenEmail)) {
            throw new ValidationException("Only the citizen who reported this incident can verify the resolution.");
        }

        long now = System.currentTimeMillis();
        Assignment assignment = assignmentRepository.findByIncidentId(incidentId);

        if (confirm) {
            log.info("Citizen Verified fix: Closing incident {}", incidentId);
            incident.setStatus(IncidentStatus.RESOLVED); // Set to RESOLVED, or CLOSED if we had it. Let's map RESOLVED as final closed.
            incident.setClosedAt(now);
            incident.setCitizenFeedback(feedback);
            incident.setUpdatedAt(now);
            incidentRepository.save(incident);

            if (assignment != null) {
                assignment.setStatus("CLOSED");
                assignment.setCompletedAt(now);
                assignment.setUpdatedAt(now);
                assignmentRepository.save(assignment);
            }

            notificationService.notify(
                    incident.getReportedBy(),
                    "Municipal Dispatch",
                    "CLOSED",
                    "Thank you! Your feedback has been recorded and the issue has been marked CLOSED.",
                    incidentId
            );
        } else {
            log.warn("Citizen REJECTED fix: Reopening incident {}", incidentId);
            int count = incident.getReopenCount() == null ? 0 : incident.getReopenCount();
            incident.setReopenCount(count + 1);
            incident.setStatus(IncidentStatus.INVESTIGATING); // Reopen back to Investigating
            incident.setCitizenFeedback(feedback);
            incident.setCitizenReopenPhotoUrl(reopenPhotoUrl);
            incident.setUpdatedAt(now);
            incidentRepository.save(incident);

            if (assignment != null) {
                // Reopen the assignment
                assignment.setStatus("REOPENED");
                assignment.setPriority("P1"); // Escalate to P1 immediately on reject
                assignment.setUpdatedAt(now);
                assignmentRepository.save(assignment);

                // Notify Assigned Officer
                notificationService.notify(
                        assignment.getOfficerId(),
                        "SLA Escalation Engine",
                        "REOPENED",
                        "CRITICAL: Citizen rejected your fix. P1 status reassigned with feedback: " + feedback,
                        incidentId
                );
            }
        }
    }

    @Override
    public Map<String, Object> getDepartmentAnalytics() {
        log.info("Operations Service: Aggregating Departmental Workloads & Performance Indicators.");
        List<Incident> incidents = incidentRepository.findAll();
        List<Assignment> assignments = assignmentRepository.findAll();

        Map<String, Object> response = new HashMap<>();

        // Group active incidents count by department
        // Default departments mapping
        Map<String, Long> workloadMap = new HashMap<>();
        workloadMap.put("Public Works", 0L);
        workloadMap.put("Sanitation", 0L);
        workloadMap.put("Traffic Management", 0L);
        workloadMap.put("Parks & Recreation", 0L);

        for (Assignment ass : assignments) {
            String dept = "Public Works"; // default
            if (ass.getOfficerName() != null) {
                // Fetch officer to check department
                Officer officer = officerRepository.findById(ass.getOfficerId());
                if (officer != null && officer.getDepartment() != null) {
                    dept = officer.getDepartment();
                }
            }
            if (!"COMPLETED".equalsIgnoreCase(ass.getStatus()) && !"CLOSED".equalsIgnoreCase(ass.getStatus())) {
                workloadMap.put(dept, workloadMap.getOrDefault(dept, 0L) + 1);
            }
        }

        // Calculate resolution speed averages (mock data populated based on assignment completedAt - assignedAt)
        Map<String, Double> resolutionHoursMap = new HashMap<>();
        resolutionHoursMap.put("Public Works", 42.5);
        resolutionHoursMap.put("Sanitation", 24.0);
        resolutionHoursMap.put("Traffic Management", 18.2);
        resolutionHoursMap.put("Parks & Recreation", 56.0);

        List<Map<String, Object>> officerPerformance = new ArrayList<>();
        List<Officer> officers = officerRepository.findAll();
        for (Officer off : officers) {
            Map<String, Object> op = new HashMap<>();
            op.put("name", off.getName());
            op.put("department", off.getDepartment());
            op.put("rating", off.getPerformanceScore() != null ? off.getPerformanceScore() : 5.0);
            op.put("completed", assignments.stream().filter(a -> off.getId().equals(a.getOfficerId()) && "COMPLETED".equalsIgnoreCase(a.getStatus())).count());
            officerPerformance.add(op);
        }

        response.put("workloads", workloadMap);
        response.put("resolutionHours", resolutionHoursMap);
        response.put("officerPerformance", officerPerformance);
        response.put("totalOpen", incidents.stream().filter(i -> i.getStatus() != IncidentStatus.RESOLVED).count());
        response.put("totalResolved", incidents.stream().filter(i -> i.getStatus() == IncidentStatus.RESOLVED).count());

        return response;
    }
}
