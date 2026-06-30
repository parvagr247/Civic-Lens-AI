package com.ai.agents;

import com.service.GeminiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Agent specialized in calculating reporting integrity, spam probability, and citizen reputation metrics.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CitizenTrustAgent implements BaseAgent {

    private final GeminiService geminiService;

    @Override
    public String getName() {
        return "CitizenTrustAgent";
    }

    @Override
    public String execute(String context) {
        log.info("Trust Agent: Evaluating report authenticity metrics.");
        String prompt = "You are the Citizen Trust & Report Authenticity Agent.\n" +
                "Given the reporter's profile history, location metadata, and complaint description:\n" +
                context + "\n" +
                "Analyze the probability of this report being spam, coordinates validity, and the reporter's history.\n" +
                "Output a JSON format matching:\n" +
                "{\n" +
                "  \"trustScore\": 85,\n" +
                "  \"confidence\": 0.90,\n" +
                "  \"isSpam\": false,\n" +
                "  \"spamScore\": 0.05,\n" +
                "  \"locationAuthenticity\": \"VALID\",\n" +
                "  \"reasoning\": \"...\"\n" +
                "}\n" +
                "Do not include other markdown wrapping, output only valid JSON.";
        return geminiService.callTextModel(prompt);
    }
}
