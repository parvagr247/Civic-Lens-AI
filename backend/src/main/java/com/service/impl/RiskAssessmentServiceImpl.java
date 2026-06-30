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
    private final com.ai.agents.SupervisorAgent supervisorAgent;

    public RiskAssessmentServiceImpl(
            IncidentRepository incidentRepository,
            IncidentAnalysisRepository analysisRepository,
            RiskAssessmentRepository riskAssessmentRepository,
            GeminiService geminiService,
            RiskAssessmentPromptBuilder promptBuilder,
            ObjectMapper objectMapper,
            com.ai.agents.SupervisorAgent supervisorAgent) {
        this.incidentRepository = incidentRepository;
        this.analysisRepository = analysisRepository;
        this.riskAssessmentRepository = riskAssessmentRepository;
        this.geminiService = geminiService;
        this.promptBuilder = promptBuilder;
        this.objectMapper = objectMapper;
        this.supervisorAgent = supervisorAgent;
    }

    @Override
    public RiskAssessment assessIncidentRisk(String incidentId) {
        log.info("Starting AI Risk Assessment for Incident ID: {}", incidentId);

        // Fetch Incident and check existence
        Incident incident = incidentRepository.findById(incidentId);
        if (incident == null) {
            throw new ResourceNotFoundException("Incident not found with ID: " + incidentId);
        }

        // Trigger the multi-agent dynamic orchestrator to process all agent cards
        try {
            supervisorAgent.orchestrate(incidentId);
            log.info("Orchestration: Successfully evaluated and updated risk metrics for {}", incidentId);
        } catch (Exception e) {
            log.error("Orchestration Warning: Multi-agent pipeline failed. Falling back to existing assessment.", e);
        }

        RiskAssessment assessment = riskAssessmentRepository.findByIncidentId(incidentId);
        if (assessment == null) {
            throw new ResourceNotFoundException("Failed to retrieve or generate risk assessment for incident: " + incidentId);
        }
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
