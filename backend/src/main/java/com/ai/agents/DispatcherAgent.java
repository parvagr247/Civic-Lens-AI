package com.ai.agents;

import com.service.GeminiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Agent specialized in drafting municipal dispatch plans, resource counts, and response coordinates.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DispatcherAgent implements BaseAgent {

    private final GeminiService geminiService;

    @Override
    public String getName() {
        return "DispatcherAgent";
    }

    @Override
    public String execute(String context) {
        log.info("Dispatcher Agent: Generating actionable dispatch strategy.");
        String prompt = "You are the Municipal Operations Dispatcher Agent.\n" +
                "Given the incident diagnostics, coordinates, nearby infrastructure, and risk scores:\n" +
                context + "\n" +
                "Develop an operational resource planning proposal. Output a JSON format matching:\n" +
                "{\n" +
                "  \"departmentsRequired\": [\"Road Department\", \"Traffic Management\"],\n" +
                "  \"resourcesNeeded\": [\"Asphalt Patch Mix\", \"Lane Barricades\", \"Signage Crew\"],\n" +
                "  \"estimatedCrewSize\": 4,\n" +
                "  \"expectedEta\": \"3 Hours\",\n" +
                "  \"responseOrder\": 1,\n" +
                "  \"priorityLevel\": \"HIGH\",\n" +
                "  \"planDetails\": \"...\",\n" +
                "  \"confidence\": 0.93\n" +
                "}\n" +
                "Do not include other markdown wrapping, output only valid JSON.";
        return geminiService.callTextModel(prompt);
    }
}
