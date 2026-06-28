package com.ai.rag;

import com.model.*;
import com.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * RetrievalService implementation querying live Firestore collections to build context prompts (RAG).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RetrievalServiceImpl implements RetrievalService {

    private final IncidentRepository incidentRepository;
    private final IncidentAnalysisRepository analysisRepository;
    private final AssignmentFirestoreRepository assignmentRepository;
    private final OfficerFirestoreRepository officerRepository;
    private final CommentFirestoreRepository commentRepository;

    @Override
    public String getIncidentRagContext(String incidentId) {
        log.info("RAG: Compiling RAG context for incident {}", incidentId);
        
        Incident incident = incidentRepository.findById(incidentId);
        if (incident == null) return "No details found for incident ID: " + incidentId;

        IncidentAnalysis analysis = analysisRepository.findByIncidentId(incidentId);
        Assignment assignment = assignmentRepository.findByIncidentId(incidentId);
        List<Comment> comments = commentRepository.findByIncidentId(incidentId);

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("=== Live Incident Context: %s ===\n", incidentId));
        sb.append(String.format("Title: %s\n", incident.getTitle()));
        sb.append(String.format("Description: %s\n", incident.getDescription()));
        sb.append(String.format("Current Status: %s\n", incident.getStatus()));
        sb.append(String.format("Reported By: %s\n", incident.getAnonymous() ? "Anonymous" : incident.getReportedBy()));
        sb.append(String.format("Coordinates: [%s, %s] (%s)\n\n", 
                incident.getLocation() != null ? incident.getLocation().getLatitude() : "N/A",
                incident.getLocation() != null ? incident.getLocation().getLongitude() : "N/A",
                incident.getLocation() != null ? incident.getLocation().getAddress() : "N/A"
        ));

        if (analysis != null) {
            sb.append("=== AI Vision Diagnostics ===\n");
            sb.append(String.format("Reasoning: %s\n", analysis.getReasoning()));
            sb.append(String.format("Summary: %s\n", analysis.getSummary()));
            sb.append(String.format("Observed Damages: %s\n", analysis.getObservedDamages()));
            sb.append(String.format("Likely Cause: %s\n\n", analysis.getLikelyCause()));
        }

        if (assignment != null) {
            sb.append("=== Dispatch Assignment ===\n");
            sb.append(String.format("Assigned Officer: %s (ID: %s)\n", assignment.getOfficerName(), assignment.getOfficerId()));
            sb.append(String.format("Dispatch Priority: %s\n", assignment.getPriority()));
            sb.append(String.format("Dispatch Status: %s\n", assignment.getStatus()));
            sb.append(String.format("SLA Deadline: %s\n\n", new java.util.Date(assignment.getDeadline()).toString()));
        }

        if (comments != null && !comments.isEmpty()) {
            sb.append("=== Community Comments ===\n");
            for (Comment c : comments) {
                sb.append(String.format("- %s: %s\n", c.getUserName(), c.getContent()));
            }
        }

        return sb.toString();
    }

    @Override
    public String getGlobalRagContext(String userEmail, String userRole, String userQuery) {
        log.info("RAG: Compiling global context for role {} and query '{}'", userRole, userQuery);

        List<Incident> incidents = incidentRepository.findAll();
        List<Officer> officers = officerRepository.findAll();
        List<Assignment> assignments = assignmentRepository.findAll();

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("=== Smart City Operational Database (RAG Grounding) ===\n"));
        sb.append(String.format("Current Active User Email: %s\n", userEmail));
        sb.append(String.format("Active User Auth Role: %s\n", userRole));
        sb.append(String.format("Total Registered complaints: %d\n", incidents.size()));
        sb.append(String.format("Total Field Responders: %d\n", officers.size()));
        sb.append(String.format("Total Dispatches: %d\n\n", assignments.size()));

        sb.append("=== Roster Performance & Departments ===\n");
        for (Officer off : officers) {
            sb.append(String.format("- Officer: %s, Dept: %s, Rating: %s, Active Status: %s\n", 
                    off.getName(), off.getDepartment(), off.getPerformanceScore(), off.getActive() ? "ACTIVE" : "INACTIVE"
            ));
        }

        sb.append("\n=== Recent active incidents list ===\n");
        // Slice top 10 reports to avoid overloading the prompt token window
        int max = Math.min(incidents.size(), 10);
        for (int i = 0; i < max; i++) {
            Incident inc = incidents.get(i);
            sb.append(String.format("- ID: %s, Title: %s, Category: %s, Status: %s, Address: %s\n", 
                    inc.getId().substring(0, 8), inc.getTitle(), inc.getCategory(), inc.getStatus(),
                    inc.getLocation() != null ? inc.getLocation().getAddress() : "N/A"
            ));
        }

        return sb.toString();
    }
}
