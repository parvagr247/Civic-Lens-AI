package com.ai.agents;

import com.service.GeminiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Agent specialized in calculating public safety impact index and priority levels.
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
        log.info("Risk Agent: Evaluating priority thresholds and threat levels.");
        String prompt = "You are the Risk Assessment Agent. Given the incident context:\n" +
                context + "\n" +
                "Evaluate the public safety hazard, structural stability, accessibility impact, and recommend a priority level (P1, P2, P3). Return JSON format.";
        return geminiService.callTextModel(prompt);
    }
}
