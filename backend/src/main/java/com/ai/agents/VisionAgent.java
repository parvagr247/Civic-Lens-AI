package com.ai.agents;

import com.service.GeminiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Agent specialized in image metadata analysis and damage classification.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class VisionAgent implements BaseAgent {

    private final GeminiService geminiService;

    @Override
    public String getName() {
        return "VisionAgent";
    }

    @Override
    public String execute(String context) {
        log.info("Vision Agent: Analyzing visual damage patterns.");
        String prompt = "You are the Vision classification agent. Given the incident context:\n" +
                context + "\n" +
                "Summarize structural damages, list likely failure causes, and output a JSON format mapping matching categories.";
        return geminiService.callTextModel(prompt);
    }
}
