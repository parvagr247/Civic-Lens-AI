package com.ai.agents;

import com.service.GeminiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Agent specialized in structural lifecycle forecasting, risk escalation curves, road closure, and SLA alerts.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PredictionAgent implements BaseAgent {

    private final GeminiService geminiService;

    @Override
    public String getName() {
        return "PredictionAgent";
    }

    @Override
    public String execute(String context) {
        log.info("Prediction Agent: Resolving structural and risk propagation forecasts.");
        String prompt = "You are the Predictive Operations Agent. Given the consolidated context:\n" +
                context + "\n" +
                "Generate a JSON prediction response exactly matching:\n" +
                "{\n" +
                "  \"repairCost\": 1200,\n" +
                "  \"estimatedHours\": 48,\n" +
                "  \"escalationProbability\": 0.45,\n" +
                "  \"futureSeverity\": \"CRITICAL\",\n" +
                "  \"incidentGrowth\": \"HIGH\",\n" +
                "  \"citizenImpact\": \"MAJOR\",\n" +
                "  \"roadClosurePossibility\": 0.80,\n" +
                "  \"weatherEffect\": \"Resurfacing delayed if wet asphalt conditions arise.\",\n" +
                "  \"estimatedCriticalTime\": \"36 Hours\",\n" +
                "  \"futureRiskScore\": 90,\n" +
                "  \"confidence\": 0.88,\n" +
                "  \"reasoning\": \"...\"\n" +
                "}\n" +
                "Do not include other markdown wrapping, output only valid JSON.";
        return geminiService.callTextModel(prompt);
    }
}

