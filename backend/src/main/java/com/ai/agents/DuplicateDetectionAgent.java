package com.ai.agents;

import com.model.Incident;
import com.model.IncidentStatus;
import com.repository.IncidentRepository;
import com.service.GeminiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Agent specialized in calculating weighted duplicate scores using GPS distance,
 * category match, temporal difference, and Gemini semantic analysis.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DuplicateDetectionAgent implements BaseAgent {

    private final GeminiService geminiService;
    private final IncidentRepository incidentRepository;

    @Override
    public String getName() {
        return "DuplicateDetectionAgent";
    }

    @Override
    public String execute(String context) {
        // Fallback for standard execution if needed
        return execute(null);
    }

    /**
     * Specialized execution that runs the spatial-semantic hybrid duplicate checker.
     *
     * @param targetIncident The new incident being analyzed.
     * @return JSON response detailing duplicate probability and candidate IDs.
     */
    public String detectDuplicates(Incident targetIncident) {
        if (targetIncident == null || targetIncident.getLocation() == null) {
            log.warn("Duplicate Agent: Target incident metadata missing. Returning empty result.");
            return "{\"duplicateProbability\":0.0,\"mergedIncidentCandidateId\":null,\"recommendation\":\"KEEP_SEPARATE\",\"reasoning\":\"No location coordinates provided.\"}";
        }

        double lat = targetIncident.getLocation().getLatitude();
        double lon = targetIncident.getLocation().getLongitude();
        long now = targetIncident.getCreatedAt() != null ? targetIncident.getCreatedAt() : System.currentTimeMillis();

        log.info("Duplicate Agent: Querying candidates within 300m for incident '{}'", targetIncident.getTitle());
        
        List<Incident> allIncidents = incidentRepository.findAll();
        List<IncidentCandidate> candidates = new ArrayList<>();

        for (Incident i : allIncidents) {
            // Do not match against itself, resolved/archived issues, or hidden incidents
            if (i.getId().equals(targetIncident.getId()) || 
                i.getStatus() == IncidentStatus.RESOLVED || 
                Boolean.TRUE.equals(i.getHidden())) {
                continue;
            }

            if (i.getLocation() == null) continue;

            double dist = calculateDistance(lat, lon, i.getLocation().getLatitude(), i.getLocation().getLongitude());
            
            if (dist <= 300.0) { // Candidate within 300 meters
                long timeDiffHrs = Math.abs(now - (i.getCreatedAt() != null ? i.getCreatedAt() : now)) / (1000 * 60 * 60);
                candidates.add(new IncidentCandidate(i, dist, timeDiffHrs));
            }
        }

        if (candidates.isEmpty()) {
            log.info("Duplicate Agent: No spatial candidates found within 300m.");
            return "{\n" +
                    "  \"duplicateProbability\": 0.0,\n" +
                    "  \"mergedIncidentCandidateId\": null,\n" +
                    "  \"recommendation\": \"KEEP_SEPARATE\",\n" +
                    "  \"reasoning\": \"No active incidents reported within 300 meters.\"\n" +
                    "}";
        }

        log.info("Duplicate Agent: Found {} spatial candidates. Running semantic analysis via LLM.", candidates.size());
        
        StringBuilder candidateContext = new StringBuilder();
        for (IncidentCandidate c : candidates) {
            candidateContext.append(String.format("- Candidate ID: %s\n  Title: %s\n  Description: %s\n  Distance: %.1f meters\n  Time Diff: %d hours\n  Category: %s\n\n",
                    c.incident.getId(), c.incident.getTitle(), c.incident.getDescription(), c.distance, c.timeDiffHrs, c.incident.getCategory()));
        }

        String prompt = String.format(
                "You are the Smart City Duplicate Detection Agent.\n" +
                "New Incident to evaluate:\n" +
                "Title: %s\n" +
                "Description: %s\n" +
                "Category: %s\n\n" +
                "Candidates reported nearby:\n" +
                "%s\n" +
                "Evaluate if the new report matches any of the candidate reports (representing the same physical issue).\n" +
                "Output a duplicate probability (0.0 to 1.0) and a recommendation (MERGE if very likely duplicate, NEEDS_REVIEW if moderately likely, KEEP_SEPARATE if different issue).\n" +
                "Return a JSON response exactly matching:\n" +
                "{\n" +
                "  \"duplicateProbability\": 0.85,\n" +
                "  \"mergedIncidentCandidateId\": \"candidate-id-here\",\n" +
                "  \"recommendation\": \"MERGE\",\n" +
                "  \"reasoning\": \"Detailed rationale here...\"\n" +
                "}\n" +
                "Set mergedIncidentCandidateId null if recommendation is KEEP_SEPARATE.",
                targetIncident.getTitle(), targetIncident.getDescription(), targetIncident.getCategory(), candidateContext.toString()
        );

        return geminiService.callTextModel(prompt);
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double rLat1 = Math.toRadians(lat1);
        double rLat2 = Math.toRadians(lat2);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(rLat1) * Math.cos(rLat2);
        double c = 2 * Math.asin(Math.sqrt(a));
        return 6371000 * c;
    }

    private static class IncidentCandidate {
        Incident incident;
        double distance;
        long timeDiffHrs;

        IncidentCandidate(Incident incident, double distance, long timeDiffHrs) {
            this.incident = incident;
            this.distance = distance;
            this.timeDiffHrs = timeDiffHrs;
        }
    }
}

