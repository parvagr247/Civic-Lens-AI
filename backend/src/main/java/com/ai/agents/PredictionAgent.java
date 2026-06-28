package com.ai.agents;

import com.service.GeminiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Agent specialized in structural lifecycle forecasting, costs, difficulty, and SLA escalation alerts.
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
        log.info("Prediction Agent: Resolving structural repair predictions.");
        String prompt = "You are the Predictive Operations Agent. Given the incident context:\n" +
                context + "\n" +
                "Generate a JSON prediction response matching:\n" +
                "{\n" +
                "  \"repairCost\": 1200,\n" +
                "  \"estimatedHours\": 48,\n" +
                "  \"escalationProbability\": 0.15,\n" +
                "  \"futureComplaintProbability\": 0.35,\n" +
                "  \"trafficImpact\": \"MEDIUM\",\n" +
                "  \"populationImpact\": 350,\n" +
                "  \"repairDifficulty\": \"MEDIUM\",\n" +
                "  \"weatherImpact\": \"Resurfacing delayed if wet asphalt conditions arise.\",\n" +
                "  \"confidence\": 0.88,\n" +
                "  \"reasoning\": \"...\"\n" +
                "}";
        return geminiService.callTextModel(prompt);
    }
}
