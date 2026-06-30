package com.ai.agents;

import com.service.GeminiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Agent specialized in calculating public safety hazard indexes, threat levels, and priority categories.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RiskAgent implements BaseAgent {

    private final GeminiService geminiService;

    @Override
    public String getName() {
        return "RiskAgent";
    }

    @Override
    public String execute(String context) {
        log.info("Risk Agent: Coordinating multi-input risk assessment calculations.");
        String prompt = "You are the smart city Risk Assessment Agent.\n" +
                "Given the consolidated multi-agent diagnostics, GIS landmarks, trust scores, weather, and history context:\n" +
                context + "\n" +
                "Perform a thorough threat and risk assessment. Return a JSON response exactly matching:\n" +
                "{\n" +
                "  \"overallRiskScore\": 78,\n" +
                "  \"severity\": \"MAJOR\",\n" + // MINOR, MEDIUM, MAJOR, CRITICAL
                "  \"urgency\": \"WITHIN_24_HOURS\",\n" + // IMMEDIATELY, WITHIN_24_HOURS, WITHIN_3_DAYS, ROUTINE
                "  \"priority\": \"P2\",\n" + // P1, P2, P3, P4
                "  \"threatLevel\": \"HIGH\",\n" + // LOW, MEDIUM, HIGH, CRITICAL
                "  \"estimatedResolutionTime\": \"24 Hours\",\n" +
                "  \"affectedPopulation\": 650,\n" +
                "  \"affectedDepartments\": [\"Public Works\", \"Traffic Management\"],\n" +
                "  \"potentialEscalation\": \"...\",\n" +
                "  \"publicSafetyImpact\": \"...\",\n" +
                "  \"infrastructureImpact\": \"...\",\n" +
                "  \"environmentalImpact\": \"...\",\n" +
                "  \"accessibilityImpact\": \"...\",\n" +
                "  \"confidence\": 0.92,\n" +
                "  \"reasoning\": \"...\",\n" +
                "  \"recommendations\": [\"Recommendation 1\", \"Recommendation 2\"]\n" +
                "}\n" +
                "Do not include other markdown wrapping, output only valid JSON.";
        return geminiService.callTextModel(prompt);
    }
}

