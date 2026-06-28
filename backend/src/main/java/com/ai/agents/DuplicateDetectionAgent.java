package com.ai.agents;

import com.service.GeminiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Agent specialized in calculating duplicate scores and checking historical reports.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DuplicateDetectionAgent implements BaseAgent {

    private final GeminiService geminiService;

    @Override
    public String getName() {
        return "DuplicateDetectionAgent";
    }

    @Override
    public String execute(String context) {
        log.info("Duplicate Agent: Querying nearby reports for similarity matching.");
        String prompt = "You are the Smart City Duplicate Detection Agent.\n" +
                "Given the new incident details and historical nearby reports:\n" +
                context + "\n" +
                "Perform comparison. Return a JSON response exactly matching:\n" +
                "{\n" +
                "  \"duplicateScore\": 85,\n" +
                "  \"confidence\": 0.92,\n" +
                "  \"reasoning\": \"...\",\n" +
                "  \"matchingIncidentId\": \"...\"\n" +
                "}\n" +
                "Set matchingIncidentId null if no duplicates match.";
        return geminiService.callTextModel(prompt);
    }
}
