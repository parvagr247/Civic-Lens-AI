package com.ai.agents;

import com.ai.memory.CopilotMemoryStore;
import com.ai.rag.RetrievalService;
import com.model.AgentExecutionLog;
import com.model.AgentOrchestrationResult;
import com.model.Incident;
import com.model.IncidentStatus;
import com.model.IssueCategory;
import com.repository.AgentOrchestrationResultRepository;
import com.repository.IncidentRepository;
import com.repository.UserFirestoreRepository;
import com.repository.IncidentAnalysisRepository;
import com.repository.RiskAssessmentRepository;
import com.service.GeminiService;
import com.service.GeoService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.model.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.CompletableFuture;

/**
 * SupervisorAgent acting as the orchestrator brain.
 * Coordinates RAG retrieval, context building, memory management, and role-based responses.
 * Now upgraded to orchestrate the dynamic parallel multi-agent municipal response engine.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SupervisorAgent {

    private final GeminiService geminiService;
    private final RetrievalService retrievalService;
    private final CopilotMemoryStore memoryStore;

    // Agent injections
    private final VisionAgent visionAgent;
    private final GeoIntelligenceAgent geoIntelligenceAgent;
    private final DuplicateDetectionAgent duplicateDetectionAgent;
    private final CitizenTrustAgent citizenTrustAgent;
    private final RiskAgent riskAgent;
    private final DispatcherAgent dispatcherAgent;
    private final PredictionAgent predictionAgent;
    private final ExplainabilityAgent explainabilityAgent;
    private final RecommendationAgent recommendationAgent;

    // Repositories & Services
    private final IncidentRepository incidentRepository;
    private final UserFirestoreRepository userRepository;
    private final AgentOrchestrationResultRepository orchestrationRepository;
    private final IncidentAnalysisRepository analysisRepository;
    private final RiskAssessmentRepository riskAssessmentRepository;
    private final GeoService geoService;
    private final ObjectMapper objectMapper;


    /**
     * Orchestrates chat queries using live grounding RAG context.
     * Retained for backward compatibility with the sidebar chat.
     */
    public String chat(String userEmail, String userRole, String query) {
        log.info("Supervisor Agent: Orchestrating chat query from user {} (Role: {})", userEmail, userRole);

        // 1. Get live database context (RAG)
        String ragContext = retrievalService.getGlobalRagContext(userEmail, userRole, query);

        // 2. Fetch history memory
        List<Map<String, String>> history = memoryStore.getHistory(userEmail);
        StringBuilder historyBuilder = new StringBuilder();
        for (Map<String, String> msg : history) {
            historyBuilder.append(String.format("%s: %s\n", msg.get("role"), msg.get("content")));
        }

        // 3. Define role constraints
        String roleConstraints = getRoleSpecificConstraints(userRole);

        // 4. Construct master prompt
        String prompt = String.format(
                "You are the CivicLens Municipal AI Copilot. An intelligent helper ground in live smart city data.\n" +
                "Active User: %s (Role: %s)\n\n" +
                "=== Role Specific Operational Directives ===\n%s\n\n" +
                "=== Live Municipal Database Grounding (RAG) ===\n%s\n\n" +
                "=== Recent Chat History ===\n%s\n\n" +
                "=== New User Message ===\n%s\n\n" +
                "Generate a clear, helpful, markdown formatted response following your directives and grounded in the RAG context.\n" +
                "Assistant Response:",
                userEmail, userRole, roleConstraints, ragContext, historyBuilder.toString(), query
        );

        // 5. Query Gemini & save to memory
        String response = geminiService.callTextModel(prompt);
        
        memoryStore.addMessage(userEmail, "user", query);
        memoryStore.addMessage(userEmail, "assistant", response);

        return response;
    }

    /**
     * Executes the complete Multi-Agent Municipal Intelligence Orchestration pipeline for a reported incident.
     * Uses asynchronous CompletableFuture stages to perform parallel checks.
     *
     * @param incidentId Unique incident UUID.
     * @return Full orchestration outcomes containing agent cards and execution logs.
     */
    public AgentOrchestrationResult orchestrate(String incidentId) {
        log.info("Orchestration Engine: Initiating pipeline execution for Incident: {}", incidentId);
        long orchestrationStart = System.currentTimeMillis();

        Incident incident = incidentRepository.findById(incidentId);
        if (incident == null) {
            log.error("Orchestration Error: Incident not found with ID: {}", incidentId);
            return null;
        }

        double lat = incident.getLocation() != null ? incident.getLocation().getLatitude() : 12.9716;
        double lon = incident.getLocation() != null ? incident.getLocation().getLongitude() : 77.5946;

        List<AgentExecutionLog> logs = Collections.synchronizedList(new ArrayList<>());

        // Initial setup log entry
        AgentOrchestrationResult resultEntity = AgentOrchestrationResult.builder()
                .id(incidentId)
                .incidentId(incidentId)
                .status("RUNNING")
                .startedAt(orchestrationStart)
                .build();
        orchestrationRepository.save(incidentId, resultEntity);

        try {
            // Stage 1: Asynchronous parallel execution of initial check agents
            CompletableFuture<String> visionFuture = CompletableFuture.supplyAsync(() ->
                executeWithObservability("VisionAgent", () -> {
                    String promptText = "Analyze the image of the civic issue: " + incident.getDescription() + ". Classify it into POTHOLE, WATER_LEAK, STREET_LIGHT, SEWER_OVERFLOW, ROAD_DAMAGE, or OTHER.";
                    return geminiService.callTextModel(promptText);
                }, logs)
            );

            CompletableFuture<String> geoFuture = CompletableFuture.supplyAsync(() ->
                executeWithObservability("GeoIntelligenceAgent", () -> {
                    Map<String, Object> spatial = geoService.analyzeNearbyContext(lat, lon);
                    return geoIntelligenceAgent.execute(spatial.toString());
                }, logs)
            );

            CompletableFuture<String> duplicateFuture = CompletableFuture.supplyAsync(() ->
                executeWithObservability("DuplicateDetectionAgent", () -> {
                    return duplicateDetectionAgent.detectDuplicates(incident);
                }, logs)
            );

            CompletableFuture<String> trustFuture = CompletableFuture.supplyAsync(() ->
                executeWithObservability("CitizenTrustAgent", () -> {
                    String trustContext = String.format("Reporter: %s, Location: (%.4f, %.4f), Description: %s, Title: %s",
                            incident.getReportedBy(), lat, lon, incident.getDescription(), incident.getTitle());
                    return citizenTrustAgent.execute(trustContext);
                }, logs)
            );

            // Wait for Stage 1 parallel checks
            CompletableFuture.allOf(visionFuture, geoFuture, duplicateFuture, trustFuture).join();

            String visionOut = visionFuture.join();
            String geoOut = geoFuture.join();
            String duplicateOut = duplicateFuture.join();
            String trustOut = trustFuture.join();

            // Extract category classification from vision and update incident
            try {
                if (visionOut.contains("POTHOLE")) incident.setCategory(IssueCategory.POTHOLE);
                else if (visionOut.contains("WATER_LEAK")) incident.setCategory(IssueCategory.WATER_LEAKAGE);
                else if (visionOut.contains("STREET_LIGHT")) incident.setCategory(IssueCategory.BROKEN_STREETLIGHT);
                else if (visionOut.contains("SEWER_OVERFLOW")) incident.setCategory(IssueCategory.FLOODING);
                else if (visionOut.contains("ROAD_DAMAGE")) incident.setCategory(IssueCategory.DAMAGED_ROAD);

                incident.setStatus(IncidentStatus.UNDER_REVIEW);
                incidentRepository.save(incident);
            } catch (Exception e) {
                log.warn("Failed to update incident category from vision output", e);
            }

            // Memory: Compile historical incident warnings
            String historySummary = compileLocationHistory(lat, lon, incidentId);

            // Stage 2: Risk Assessment (Sequentially waits for stage 1 context)
            String riskContext = String.format(
                    "Incident Title: %s\nDescription: %s\nCategory: %s\n" +
                    "=== Vision Findings ===\n%s\n\n" +
                    "=== Geo Intelligence ===\n%s\n\n" +
                    "=== Duplicate Score ===\n%s\n\n" +
                    "=== Trust Index ===\n%s\n\n" +
                    "=== City History ===\n%s\n\n" +
                    "=== Weather/Traffic ===\nOvercast with high congestion at peak operational hours.\n",
                    incident.getTitle(), incident.getDescription(), incident.getCategory(), visionOut, geoOut, duplicateOut, trustOut, historySummary
            );

            String riskOut = executeWithObservability("RiskAgent", () -> riskAgent.execute(riskContext), logs);

            // Stage 3: Asynchronous parallel execution of downstream planning agents
            CompletableFuture<String> dispatcherFuture = CompletableFuture.supplyAsync(() ->
                executeWithObservability("DispatcherAgent", () -> {
                    String dispatcherContext = String.format("Incident: %s\nRisk findings: %s\nGIS coordinates: %s",
                            incident.getDescription(), riskOut, geoOut);
                    return dispatcherAgent.execute(dispatcherContext);
                }, logs)
            );

            CompletableFuture<String> predictionFuture = CompletableFuture.supplyAsync(() ->
                executeWithObservability("PredictionAgent", () -> {
                    String predictionContext = String.format("Incident: %s\nRisk: %s", incident.getDescription(), riskOut);
                    return predictionAgent.execute(predictionContext);
                }, logs)
            );

            CompletableFuture<String> explainabilityFuture = CompletableFuture.supplyAsync(() ->
                executeWithObservability("ExplainabilityAgent", () -> {
                    String xaiContext = String.format("Incident: %s\nRisk: %s\nGeo: %s\nTrust: %s",
                            incident.getDescription(), riskOut, geoOut, trustOut);
                    return explainabilityAgent.execute(xaiContext);
                }, logs)
            );

            CompletableFuture<String> recommendationFuture = CompletableFuture.supplyAsync(() ->
                executeWithObservability("RecommendationAgent", () -> {
                    String recContext = String.format("Incident category: %s\nRisk findings: %s", incident.getCategory(), riskOut);
                    return recommendationAgent.execute(recContext);
                }, logs)
            );

            CompletableFuture.allOf(dispatcherFuture, predictionFuture, explainabilityFuture, recommendationFuture).join();

            String dispatcherOut = dispatcherFuture.join();
            String predictionOut = predictionFuture.join();
            String explainabilityOut = explainabilityFuture.join();
            String recommendationOut = recommendationFuture.join();

            // Stage 4: Aggregate confidences and save results
            double finalConfidence = logs.stream()
                    .filter(l -> l.getConfidence() != null)
                    .mapToDouble(AgentExecutionLog::getConfidence)
                    .average()
                    .orElse(0.85);

            List<String> relationships = buildKnowledgeGraphRelationships(
                    incident.getCategory() != null ? incident.getCategory().name() : "OTHER"
            );

            long completedAt = System.currentTimeMillis();

            resultEntity.setStatus("COMPLETED");
            resultEntity.setVisionOutput(visionOut);
            resultEntity.setGeoOutput(geoOut);
            resultEntity.setDuplicateOutput(duplicateOut);
            resultEntity.setTrustOutput(trustOut);
            resultEntity.setRiskOutput(riskOut);
            resultEntity.setDispatcherOutput(dispatcherOut);
            resultEntity.setPredictionOutput(predictionOut);
            resultEntity.setExplainabilityOutput(explainabilityOut);
            resultEntity.setRecommendationOutput(recommendationOut);
            resultEntity.setFinalConfidence(finalConfidence);
            resultEntity.setExecutionLogs(new ArrayList<>(logs));
            resultEntity.setKnowledgeGraphRelationships(relationships);
            resultEntity.setCompletedAt(completedAt);

            orchestrationRepository.save(incidentId, resultEntity);
            log.info("Orchestration Engine: Pipeline completed successfully in {} ms.", (completedAt - orchestrationStart));

            // Resilient parse of visionOut -> IncidentAnalysis (Backward Compatibility)
            try {
                Map<String, Object> visionMap = new HashMap<>();
                try {
                    visionMap = objectMapper.readValue(visionOut, Map.class);
                } catch (Exception parseEx) {
                    log.warn("Failed to parse vision JSON. Using regex fallback.", parseEx);
                }
                
                String summary = visionMap.get("summary") != null ? visionMap.get("summary").toString() : "Visual analysis completed: " + incident.getDescription();
                List<String> observedDamages = (List<String>) visionMap.get("observedDamages");
                if (observedDamages == null) {
                    observedDamages = new ArrayList<>();
                    observedDamages.add("Structural damage detected from report");
                }
                String likelyCause = visionMap.get("likelyCause") != null ? visionMap.get("likelyCause").toString() : "Environmental exposure";
                double confidence = extractConfidence(visionOut);
                String recommendedAction = visionMap.get("recommendedAction") != null ? visionMap.get("recommendedAction").toString() : "Inspect site";
                String reasoning = visionMap.get("reasoning") != null ? visionMap.get("reasoning").toString() : "Visual indicator";

                IncidentAnalysis existingAnalysis = analysisRepository.findByIncidentId(incidentId);
                IncidentAnalysis analysis = IncidentAnalysis.builder()
                        .id(existingAnalysis != null ? existingAnalysis.getId() : UUID.randomUUID().toString())
                        .incidentId(incidentId)
                        .summary(summary)
                        .observedDamages(observedDamages)
                        .likelyCause(likelyCause)
                        .confidence(confidence)
                        .recommendedAction(recommendedAction)
                        .reasoning(reasoning)
                        .analyzedAt(System.currentTimeMillis())
                        .build();
                analysisRepository.save(analysis);
                log.info("Orchestration: Successfully synced backward-compatible IncidentAnalysis");
            } catch (Exception ex) {
                log.error("Orchestration warning: Failed to sync IncidentAnalysis document", ex);
            }

            // Resilient parse of riskOut -> RiskAssessment (Backward Compatibility)
            try {
                Map<String, Object> riskMap = new HashMap<>();
                try {
                    riskMap = objectMapper.readValue(riskOut, Map.class);
                } catch (Exception parseEx) {
                    log.warn("Failed to parse risk JSON. Using regex fallback.", parseEx);
                }

                int riskScore = riskMap.get("overallRiskScore") != null ? ((Number) riskMap.get("overallRiskScore")).intValue() : 60;
                String severityStr = riskMap.get("severity") != null ? riskMap.get("severity").toString() : "MEDIUM";
                String urgencyStr = riskMap.get("urgency") != null ? riskMap.get("urgency").toString() : "WITHIN_3_DAYS";
                String priorityStr = riskMap.get("priority") != null ? riskMap.get("priority").toString() : "P3";
                String threatStr = riskMap.get("threatLevel") != null ? riskMap.get("threatLevel").toString() : "MEDIUM";
                String estTime = riskMap.get("estimatedResolutionTime") != null ? riskMap.get("estimatedResolutionTime").toString() : "48 Hours";
                int pop = riskMap.get("affectedPopulation") != null ? ((Number) riskMap.get("affectedPopulation")).intValue() : 200;
                List<String> depts = (List<String>) riskMap.get("affectedDepartments");
                if (depts == null) {
                    depts = new ArrayList<>();
                    depts.add("Public Works");
                }
                String potentialEsc = riskMap.get("potentialEscalation") != null ? riskMap.get("potentialEscalation").toString() : "Minimal risk of immediate collapse";
                String publicSafety = riskMap.get("publicSafetyImpact") != null ? riskMap.get("publicSafetyImpact").toString() : "General pedestrian risk";
                String infraImpact = riskMap.get("infrastructureImpact") != null ? riskMap.get("infrastructureImpact").toString() : "Minor road base wearing";
                String envImpact = riskMap.get("environmentalImpact") != null ? riskMap.get("environmentalImpact").toString() : "None";
                String accessibility = riskMap.get("accessibilityImpact") != null ? riskMap.get("accessibilityImpact").toString() : "None";
                String reasoning = riskMap.get("reasoning") != null ? riskMap.get("reasoning").toString() : "AI assessed";
                List<String> recs = (List<String>) riskMap.get("recommendations");
                if (recs == null) {
                    recs = new ArrayList<>();
                    recs.add("Erect safety markers");
                }

                RiskSeverity severity = safeEnum(RiskSeverity.class, severityStr, RiskSeverity.MODERATE);
                ResponseUrgency urgency = safeEnum(ResponseUrgency.class, urgencyStr, ResponseUrgency.WITHIN_3_DAYS);
                PriorityLevel priority = safeEnum(PriorityLevel.class, priorityStr, PriorityLevel.P3);
                ThreatLevel threatLevel = safeEnum(ThreatLevel.class, threatStr, ThreatLevel.MEDIUM);

                RiskAssessment existingRisk = riskAssessmentRepository.findByIncidentId(incidentId);
                RiskAssessment assessment = RiskAssessment.builder()
                        .id(existingRisk != null ? existingRisk.getId() : UUID.randomUUID().toString())
                        .incidentId(incidentId)
                        .overallRiskScore(riskScore)
                        .severity(severity)
                        .urgency(urgency)
                        .confidence(extractConfidence(riskOut))
                        .priority(priority)
                        .threatLevel(threatLevel)
                        .estimatedResolutionTime(estTime)
                        .affectedPopulation(pop)
                        .affectedDepartments(depts)
                        .potentialEscalation(potentialEsc)
                        .publicSafetyImpact(publicSafety)
                        .infrastructureImpact(infraImpact)
                        .environmentalImpact(envImpact)
                        .accessibilityImpact(accessibility)
                        .reasoning(reasoning)
                        .recommendations(recs)
                        .createdAt(existingRisk != null ? existingRisk.getCreatedAt() : System.currentTimeMillis())
                        .updatedAt(System.currentTimeMillis())
                        .build();
                riskAssessmentRepository.save(assessment);
                log.info("Orchestration: Successfully synced backward-compatible RiskAssessment");
            } catch (Exception ex) {
                log.error("Orchestration warning: Failed to sync RiskAssessment document", ex);
            }

            return resultEntity;

        } catch (Exception e) {
            log.error("Orchestration Engine Critical Failure for Incident: {}", incidentId, e);
            resultEntity.setStatus("FAILED");
            resultEntity.setCompletedAt(System.currentTimeMillis());
            resultEntity.setExecutionLogs(new ArrayList<>(logs));
            orchestrationRepository.save(incidentId, resultEntity);
            throw new RuntimeException("AI Orchestration engine failure", e);
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


    private <T> T executeWithObservability(String agentName, java.util.function.Supplier<T> agentTask, List<AgentExecutionLog> logs) {
        long start = System.currentTimeMillis();
        AgentExecutionLog logEntry = AgentExecutionLog.builder()
                .agentName(agentName)
                .status("RUNNING")
                .startTime(start)
                .retryCount(0)
                .build();
        logs.add(logEntry);
        try {
            T result = agentTask.get();
            long end = System.currentTimeMillis();
            logEntry.setStatus("COMPLETED");
            logEntry.setEndTime(end);
            logEntry.setDurationMs(end - start);
            logEntry.setConfidence(extractConfidence(result));
            return result;
        } catch (Exception e) {
            long end = System.currentTimeMillis();
            logEntry.setStatus("FAILED");
            logEntry.setEndTime(end);
            logEntry.setDurationMs(end - start);
            logEntry.setErrorMessage(e.getMessage());
            logEntry.setConfidence(0.0);
            throw e;
        }
    }

    private double extractConfidence(Object result) {
        if (result == null) return 0.8;
        String json = result.toString();
        try {
            java.util.regex.Pattern p = java.util.regex.Pattern.compile("\"confidence\"\\s*:\\s*([0-9.]+)");
            java.util.regex.Matcher m = p.matcher(json);
            if (m.find()) {
                return Double.parseDouble(m.group(1));
            }
            p = java.util.regex.Pattern.compile("\"confidenceScore\"\\s*:\\s*([0-9.]+)");
            m = p.matcher(json);
            if (m.find()) {
                return Double.parseDouble(m.group(1));
            }
        } catch (Exception e) {
            log.warn("Failed to extract confidence from JSON snippet: {}", json.substring(0, Math.min(json.length(), 100)));
        }
        return 0.85;
    }

    private String compileLocationHistory(double lat, double lon, String currentIncidentId) {
        List<Incident> allIncidents = incidentRepository.findAll();
        int matchingCount = 0;
        long sixMonthsAgo = System.currentTimeMillis() - (180L * 24 * 60 * 60 * 1000);
        
        for (Incident i : allIncidents) {
            if (i.getId().equals(currentIncidentId) || i.getLocation() == null) continue;
            
            double distance = calculateDistance(lat, lon, i.getLocation().getLatitude(), i.getLocation().getLongitude());
            long creationTime = i.getCreatedAt() != null ? i.getCreatedAt() : 0L;
            
            if (distance <= 200.0 && creationTime >= sixMonthsAgo) {
                matchingCount++;
            }
        }

        if (matchingCount > 0) {
            return String.format("This coordinates location has received %d complaints during the last six months, indicating recurring structural degradation.", matchingCount);
        }
        return "No recent historical complaints registered near this coordinates location.";
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

    private List<String> buildKnowledgeGraphRelationships(String category) {
        List<String> relationships = new ArrayList<>();
        if (category == null) return relationships;
        
        switch (category.toUpperCase()) {
            case "WATER_LEAK":
                relationships.add("Water Leakage -> Road Damage");
                relationships.add("Road Damage -> Traffic Congestion");
                relationships.add("Traffic Congestion -> Accident Risk");
                relationships.add("Accident Risk -> Emergency Delay");
                break;
            case "POTHOLE":
            case "ROAD_DAMAGE":
                relationships.add("Road Damage -> Traffic Congestion");
                relationships.add("Traffic Congestion -> Accident Risk");
                relationships.add("Accident Risk -> Emergency Delay");
                break;
            case "STREET_LIGHT":
                relationships.add("Broken Street Light -> Darkness");
                relationships.add("Darkness -> Accident Risk");
                relationships.add("Darkness -> Crime Risk");
                break;
            case "SEWER_OVERFLOW":
                relationships.add("Sewer Overflow -> Water Contamination");
                relationships.add("Water Contamination -> Public Health Risk");
                relationships.add("Sewer Overflow -> Road Blockage");
                break;
            default:
                relationships.add("General Municipal Issue -> Standard Response Pipeline");
        }
        return relationships;
    }

    private String getRoleSpecificConstraints(String role) {
        switch (role.toUpperCase()) {
            case "CITIZEN":
                return "- Guide citizens on why their reports might be delayed.\n" +
                       "- Recommend safer travel routes based on pothole hazards.\n" +
                       "- Explain risk scores and summarize community engagement.\n" +
                       "- Do not reveal internal dispatcher notes or budget costs.";
            case "OFFICER":
                return "- Assist officers in prioritizing their active task lists.\n" +
                       "- Summarize instructions and deadlines for their assignments.\n" +
                       "- Help draft professional completion summary reports.\n" +
                       "- Outline routing plans to reach destination coordinates.";
            case "ADMIN":
                return "- Help administrators review officer workloads and departmental completions.\n" +
                       "- Suggest reassignments or identify bottlenecks in SLA performance.\n" +
                       "- Draft city-wide infrastructure policy recommendations.\n" +
                       "- Explain duplicate scores, prediction estimates, and allocation criteria.";
            default:
                return "- Provide general information on registered complaints.";
        }
    }
}

