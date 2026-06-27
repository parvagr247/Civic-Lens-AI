package com.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.dto.RiskStatisticsResponse;
import com.model.*;
import com.exception.AIException;
import com.exception.ResourceNotFoundException;
import com.exception.ValidationException;
import com.repository.IncidentAnalysisRepository;
import com.repository.IncidentRepository;
import com.repository.RiskAssessmentRepository;
import com.service.GeminiService;
import com.prompt.RiskAssessmentPromptBuilder;
import com.service.RiskAssessmentService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service implementation orchestrating AI Risk Assessment business logic.
 */
@Slf4j
@Service
public class RiskAssessmentServiceImpl implements RiskAssessmentService {

    private final IncidentRepository incidentRepository;
    private final IncidentAnalysisRepository analysisRepository;
    private final RiskAssessmentRepository riskAssessmentRepository;
    private final GeminiService geminiService;
    private final RiskAssessmentPromptBuilder promptBuilder;
    private final ObjectMapper objectMapper;

    public RiskAssessmentServiceImpl(
            IncidentRepository incidentRepository,
            IncidentAnalysisRepository analysisRepository,
            RiskAssessmentRepository riskAssessmentRepository,
            GeminiService geminiService,
            RiskAssessmentPromptBuilder promptBuilder,
            ObjectMapper objectMapper) {
        this.incidentRepository = incidentRepository;
        this.analysisRepository = analysisRepository;
        this.riskAssessmentRepository = riskAssessmentRepository;
        this.geminiService = geminiService;
        this.promptBuilder = promptBuilder;
        this.objectMapper = objectMapper;
    }

    @Override
    public RiskAssessment assessIncidentRisk(String incidentId) {
        log.info("Starting AI Risk Assessment for Incident ID: {}", incidentId);

        // 1. Fetch Incident and check existence
        Incident incident = incidentRepository.findById(incidentId);
        if (incident == null) {
            throw new ResourceNotFoundException("Incident not found with ID: " + incidentId);
        }

        // 2. Fetch Visual Analysis and check existence
        IncidentAnalysis analysis = analysisRepository.findByIncidentId(incidentId);
        if (analysis == null) {
            log.warn("Incident {} lacks AI visual analysis. Cannot perform risk assessment.", incidentId);
            throw new ValidationException("Incident must undergo visual analysis before assessing risk.");
        }

        // 3. Build text-based risk analysis prompt
        String promptText = promptBuilder.buildRiskPrompt(
                incident.getTitle(),
                incident.getDescription(),
                incident.getCategory() != null ? incident.getCategory().name() : "OTHER",
                incident.getLocation() != null ? incident.getLocation().getAddress() : "Unknown location",
                analysis.getSummary(),
                analysis.getObservedDamages()
        );

        // 4. Submit prompt to Gemini Service
        String jsonContent = geminiService.callTextModel(promptText);

        // 5. Parse JSON output and map to RiskAssessment entity
        GeminiRiskRaw raw = parseRiskJson(jsonContent);

        // 6. Build RiskAssessment object
        RiskSeverity severity = safeEnum(RiskSeverity.class, raw.getSeverity(), RiskSeverity.MAJOR);
        ResponseUrgency urgency = safeEnum(ResponseUrgency.class, raw.getUrgency(), ResponseUrgency.WITHIN_3_DAYS);
        PriorityLevel priority = safeEnum(PriorityLevel.class, raw.getPriority(), PriorityLevel.P3);
        ThreatLevel threatLevel = safeEnum(ThreatLevel.class, raw.getThreatLevel(), ThreatLevel.MEDIUM);

        // Check if an existing assessment already exists to preserve creation timestamp
        RiskAssessment existing = riskAssessmentRepository.findByIncidentId(incidentId);
        long now = System.currentTimeMillis();

        RiskAssessment assessment = RiskAssessment.builder()
                .id(existing != null ? existing.getId() : UUID.randomUUID().toString())
                .incidentId(incidentId)
                .overallRiskScore(raw.getOverallRiskScore() != null ? raw.getOverallRiskScore() : 50)
                .severity(severity)
                .urgency(urgency)
                .confidence(raw.getConfidence() != null ? raw.getConfidence() : 0.8)
                .priority(priority)
                .threatLevel(threatLevel)
                .estimatedResolutionTime(raw.getEstimatedResolutionTime())
                .affectedPopulation(raw.getAffectedPopulation() != null ? raw.getAffectedPopulation() : 100)
                .affectedDepartments(raw.getAffectedDepartments())
                .potentialEscalation(raw.getPotentialEscalation())
                .publicSafetyImpact(raw.getPublicSafetyImpact())
                .infrastructureImpact(raw.getInfrastructureImpact())
                .environmentalImpact(raw.getEnvironmentalImpact())
                .accessibilityImpact(raw.getAccessibilityImpact())
                .reasoning(raw.getReasoning())
                .recommendations(raw.getRecommendations())
                .createdAt(existing != null ? existing.getCreatedAt() : now)
                .updatedAt(now)
                .build();

        // 7. Save to Firestore
        riskAssessmentRepository.save(assessment);
        log.info("Risk assessment generated and saved successfully for incident: {}", incidentId);

        return assessment;
    }

    @Override
    public RiskAssessment getRiskByIncidentId(String incidentId) {
        log.info("Fetching risk assessment for Incident ID: {}", incidentId);
        RiskAssessment assessment = riskAssessmentRepository.findByIncidentId(incidentId);
        if (assessment == null) {
            throw new ResourceNotFoundException("No risk assessment report found for incident ID: " + incidentId);
        }
        return assessment;
    }

    @Override
    public RiskAssessment reanalyzeRisk(String incidentId) {
        log.info("Triggered manual risk re-analysis for Incident ID: {}", incidentId);
        return assessIncidentRisk(incidentId);
    }

    @Override
    public List<RiskAssessment> getHighRiskAssessments() {
        log.info("Retrieving all high-risk assessments (score >= 60)");
        return riskAssessmentRepository.findHighRisk(60);
    }

    @Override
    public RiskStatisticsResponse getStatistics() {
        log.info("Calculating city-wide risk statistics");
        List<RiskAssessment> all = riskAssessmentRepository.findAll();

        double averageRisk = all.stream()
                .mapToInt(RiskAssessment::getOverallRiskScore)
                .average()
                .orElse(0.0);

        int highestRisk = all.stream()
                .mapToInt(RiskAssessment::getOverallRiskScore)
                .max()
                .orElse(0);

        long critical = all.stream().filter(a -> a.getThreatLevel() == ThreatLevel.CRITICAL).count();
        long high = all.stream().filter(a -> a.getThreatLevel() == ThreatLevel.HIGH).count();
        long medium = all.stream().filter(a -> a.getThreatLevel() == ThreatLevel.MEDIUM).count();
        long low = all.stream().filter(a -> a.getThreatLevel() == ThreatLevel.LOW).count();

        // Compute priority distributions
        Map<String, Long> priorityDist = all.stream()
                .collect(Collectors.groupingBy(a -> a.getPriority().name(), Collectors.counting()));
        // Fill missing priorities to avoid empty charts
        for (PriorityLevel p : PriorityLevel.values()) {
            priorityDist.putIfAbsent(p.name(), 0L);
        }

        // Compute severity distributions
        Map<String, Long> severityDist = all.stream()
                .collect(Collectors.groupingBy(a -> a.getSeverity().name(), Collectors.counting()));
        for (RiskSeverity s : RiskSeverity.values()) {
            severityDist.putIfAbsent(s.name(), 0L);
        }

        return RiskStatisticsResponse.builder()
                .averageRiskScore(averageRisk)
                .highestRiskScore(highestRisk)
                .totalAssessedCount((long) all.size())
                .criticalThreatCount(critical)
                .highThreatCount(high)
                .mediumThreatCount(medium)
                .lowThreatCount(low)
                .priorityDistribution(priorityDist)
                .severityDistribution(severityDist)
                .build();
    }

    private GeminiRiskRaw parseRiskJson(String json) {
        try {
            log.debug("Parsing Gemini risk assessment JSON: {}", json);
            return objectMapper.readValue(json, GeminiRiskRaw.class);
        } catch (Exception e) {
            log.error("Failed to parse Gemini risk assessment JSON. Content: {}", json, e);
            throw new AIException("Failed to parse AI risk assessment JSON report.", e);
        }
    }

    private <E extends Enum<E>> E safeEnum(Class<E> enumClass, String val, E defaultVal) {
        if (val == null) return defaultVal;
        try {
            return Enum.valueOf(enumClass, val.trim().toUpperCase());
        } catch (Exception e) {
            log.warn("Unknown enum value '{}' for enum '{}'. Defaulting to {}", val, enumClass.getSimpleName(), defaultVal);
            return defaultVal;
        }
    }

    // Inner deserializer helper class
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    private static class GeminiRiskRaw {
        private Integer overallRiskScore;
        private String severity;
        private String urgency;
        private Double confidence;
        private String priority;
        private String threatLevel;
        private String estimatedResolutionTime;
        private Integer affectedPopulation;
        private List<String> affectedDepartments;
        private String potentialEscalation;
        private String publicSafetyImpact;
        private String infrastructureImpact;
        private String environmentalImpact;
        private String accessibilityImpact;
        private String reasoning;
        private List<String> recommendations;
    }
}
