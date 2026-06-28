package com.ai.agents;

import com.service.GeminiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Agent specialized in dispatch equipment list, inspector team sizes, and budget planning.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RecommendationAgent implements BaseAgent {

    private final GeminiService geminiService;

    @Override
    public String getName() {
        return "RecommendationAgent";
    }

    @Override
    public String execute(String context) {
        log.info("Recommendation Agent: Computing dispatcher equipment list and detour suggestions.");
        String prompt = "You are the Operations Recommendation Agent. Given the incident context:\n" +
                context + "\n" +
                "Generate a JSON recommendation response matching:\n" +
                "{\n" +
                "  \"recommendedDepartment\": \"...\",\n" +
                "  \"recommendedOfficerName\": \"...\",\n" +
                "  \"priority\": \"P2\",\n" +
                "  \"estimatedHours\": 72,\n" +
                "  \"equipmentRequired\": [\"Asphalt mix\", \"Tar sealer\"],\n" +
                "  \"fieldTeamSize\": 3,\n" +
                "  \"inspectionRequired\": true,\n" +
                "  \"escalationRules\": \"Bump if inactive 12h\",\n" +
                "  \"budgetCategory\": \"INFRASTRUCTURE\",\n" +
                "  \"alternativeActions\": [\"Detour cones\"],\n" +
                "  \"reasoning\": \"...\"\n" +
                "}";
        return geminiService.callTextModel(prompt);
    }
}
