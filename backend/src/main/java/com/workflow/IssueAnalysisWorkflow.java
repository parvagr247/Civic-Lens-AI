package com.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.model.*;
import com.dto.CreateIncidentRequest;
import com.dto.IncidentResponse;
import com.dto.AnalysisResponse;
import com.repository.IncidentAnalysisRepository;
import com.repository.IncidentRepository;
import com.service.StorageService;
import com.service.GeminiService;
import com.util.PromptBuilder;
import com.exception.AIException;
import com.exception.ValidationException;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Enterprise-grade workflow orchestrator for analyzing civic issues.
 * Coordinates Firebase Storage image upload, database storage, Gemini Vision API analysis,
 * structured JSON mapping, and transactional-style updates to Firestore records.
 */
@Slf4j
@Component
public class IssueAnalysisWorkflow {

    private final StorageService storageService;
    private final IncidentRepository incidentRepository;
    private final com.ai.agents.SupervisorAgent supervisorAgent;

    public IssueAnalysisWorkflow(
            StorageService storageService,
            IncidentRepository incidentRepository,
            com.ai.agents.SupervisorAgent supervisorAgent) {
        this.storageService = storageService;
        this.incidentRepository = incidentRepository;
        this.supervisorAgent = supervisorAgent;
    }

    /**
     * Executes the issue creation, upload, AI vision analysis, and persistence pipeline.
     *
     * @param request Create incident request parameters.
     * @return IncidentResponse mapping the created incident.
     */
    public IncidentResponse processAndAnalyze(CreateIncidentRequest request) {
        String incidentId = UUID.randomUUID().toString();
        log.info("Starting IssueAnalysisWorkflow process for new Incident ID: {}", incidentId);

        // 1. Upload image to Firebase Storage
        StorageService.ImageUploadResult uploadResult = storageService.uploadIncidentImage(request.getImage(), incidentId);
        String imageUrl = uploadResult.getDownloadUrl();
        String imagePath = uploadResult.getStoragePath();

        // 2. Persist initial Incident record
        GeoLocation location = new GeoLocation(
                request.getLatitude(),
                request.getLongitude(),
                request.getAddress()
        );

        String reportedBy = "anonymous@civiclens.gov";
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
                reportedBy = auth.getName();
            }
        } catch (Exception e) {
            log.warn("Failed to extract authenticated email during issue creation");
        }

        Incident incident = Incident.builder()
                .id(incidentId)
                .title(request.getTitle())
                .description(request.getDescription())
                .status(IncidentStatus.REPORTED)
                .category(IssueCategory.OTHER) // Default until analyzed
                .severity(SeverityLevel.MEDIUM) // Default until prioritized
                .location(location)
                .imageUrl(imageUrl)
                .imagePath(imagePath)
                .reportedBy(reportedBy)
                .anonymous(request.getAnonymous())
                .supportCount(0)
                .supportedBy(new java.util.ArrayList<>())
                .createdAt(System.currentTimeMillis())
                .updatedAt(System.currentTimeMillis())
                .build();

        incidentRepository.save(incident);
        log.info("Initial Incident record saved with status: REPORTED");

        // 3. Trigger the multi-agent dynamic orchestrator
        try {
            supervisorAgent.orchestrate(incidentId);
            log.info("Workflow: Dynamic multi-agent orchestration completed for incident {}", incidentId);
        } catch (Exception e) {
            log.error("Workflow Error: Multi-agent orchestration failed for incident {}", incidentId, e);
        }

        // Fetch refreshed incident
        Incident updatedIncident = incidentRepository.findById(incidentId);
        return IncidentResponse.fromEntity(updatedIncident != null ? updatedIncident : incident);
    }
}
