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
    private final IncidentAnalysisRepository analysisRepository;
    private final GeminiService geminiService;
    private final PromptBuilder promptBuilder;
    private final ObjectMapper objectMapper;

    public IssueAnalysisWorkflow(
            StorageService storageService,
            IncidentRepository incidentRepository,
            IncidentAnalysisRepository analysisRepository,
            GeminiService geminiService,
            PromptBuilder promptBuilder,
            ObjectMapper objectMapper) {
        this.storageService = storageService;
        this.incidentRepository = incidentRepository;
        this.analysisRepository = analysisRepository;
        this.geminiService = geminiService;
        this.promptBuilder = promptBuilder;
        this.objectMapper = objectMapper;
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
                .createdAt(System.currentTimeMillis())
                .updatedAt(System.currentTimeMillis())
                .build();

        incidentRepository.save(incident);
        log.info("Initial Incident record saved with status: REPORTED");

        // 3. Build AI prompt and request analysis from Gemini Vision
        String promptText = promptBuilder.buildVisionAnalysisPrompt(request.getDescription());
        String aiResponseJson = geminiService.analyzeImage(request.getImage(), promptText);

        // 4. Parse JSON and map to IncidentAnalysis entity
        GeminiAnalysisOutput parsedOutput = parseAiResponse(aiResponseJson);

        IncidentAnalysis analysis = IncidentAnalysis.builder()
                .id(UUID.randomUUID().toString())
                .incidentId(incidentId)
                .summary(parsedOutput.getSummary())
                .observedDamages(parsedOutput.getObservedDamages())
                .likelyCause(parsedOutput.getLikelyCause())
                .confidence(parsedOutput.getConfidence())
                .recommendedAction(parsedOutput.getRecommendedAction())
                .reasoning(parsedOutput.getReasoning())
                .analyzedAt(System.currentTimeMillis())
                .build();

        analysisRepository.save(analysis);
        log.info("Incident Analysis record successfully saved.");

        // 5. Update parent Incident properties with AI classification results
        incident.setCategory(parsedOutput.getCategory());
        incident.setStatus(IncidentStatus.UNDER_REVIEW);
        incident.setUpdatedAt(System.currentTimeMillis());
        
        incidentRepository.save(incident);
        log.info("Incident updated with AI category: {} and status: UNDER_REVIEW", parsedOutput.getCategory());

        return IncidentResponse.fromEntity(incident);
    }

    /**
     * Parses the raw JSON response from Gemini into a structured class model.
     */
    private GeminiAnalysisOutput parseAiResponse(String jsonContent) {
        try {
            log.debug("Parsing Gemini response JSON content: {}", jsonContent);
            GeminiResponseRaw raw = objectMapper.readValue(jsonContent, GeminiResponseRaw.class);
            
            // Map parsed category text to enum safely
            IssueCategory category;
            try {
                category = IssueCategory.valueOf(raw.getCategory().toUpperCase());
            } catch (Exception e) {
                log.warn("Unknown issue category received: {}. Defaulting to OTHER.", raw.getCategory());
                category = IssueCategory.OTHER;
            }

            return new GeminiAnalysisOutput(
                    category,
                    raw.getSummary(),
                    raw.getObservedDamages(),
                    raw.getLikelyCause(),
                    raw.getConfidence(),
                    raw.getRecommendedAction(),
                    raw.getReasoning()
            );
        } catch (Exception e) {
            log.error("Failed to parse Gemini Vision JSON response. Raw output: {}", jsonContent, e);
            throw new AIException("Malformed AI response format: Failed to parse structured JSON report.", e);
        }
    }

    // Inner class helper to represent raw Jackson deserialization target
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    private static class GeminiResponseRaw {
        private String category;
        private String summary;
        private List<String> observedDamages;
        private String likelyCause;
        private Double confidence;
        private String recommendedAction;
        private String reasoning;
    }

    // Helper holder class for clean business mapping
    @Data
    @AllArgsConstructor
    private static class GeminiAnalysisOutput {
        private IssueCategory category;
        private String summary;
        private List<String> observedDamages;
        private String likelyCause;
        private Double confidence;
        private String recommendedAction;
        private String reasoning;
    }
}
