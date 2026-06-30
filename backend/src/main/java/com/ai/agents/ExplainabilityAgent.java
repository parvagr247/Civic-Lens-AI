package com.ai.agents;

import com.service.GeminiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Agent specialized in summarizing AI decisions, compile evidence lists, and explain priority justifications.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ExplainabilityAgent implements BaseAgent {

    private final GeminiService geminiService;

    @Override
    public String getName() {
        return "ExplainabilityAgent";
    }

    @Override
    public String execute(String context) {
        log.info("Explainability Agent: Outlining decision rationale footnotes.");
        String prompt = "You are the Explainable AI (XAI) Agent for Municipal Operations.\n" +
                "Given the compiled details, risk outputs, spatial landmarks, and duplicate scores:\n" +
                context + "\n" +
                "Explain the final priority and dispatch plan. Output a JSON format matching:\n" +
                "{\n" +
                "  \"decision\": \"P1 Priority Route Dispatch\",\n" +
                "  \"reasoning\": \"...\",\n" +
                "  \"evidence\": [\"Evidence Item 1\", \"Evidence Item 2\"],\n" +
                "  \"confidence\": 0.96\n" +
                "}\n" +
                "Do not include other markdown wrapping, output only valid JSON.";
        return geminiService.callTextModel(prompt);
    }
}
