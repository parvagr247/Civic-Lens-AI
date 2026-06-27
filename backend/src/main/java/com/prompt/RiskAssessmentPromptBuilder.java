package com.prompt;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Prompt Builder that loads the risk assessment prompt template and injects incident metadata.
 */
@Slf4j
@Component
public class RiskAssessmentPromptBuilder {

    private final ResourceLoader resourceLoader;

    public RiskAssessmentPromptBuilder(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    /**
     * Builds the prompt payload for the risk assessment workflow.
     */
    public String buildRiskPrompt(
            String title,
            String description,
            String category,
            String address,
            String analysisSummary,
            List<String> observedDamages) {
        
        log.debug("Building risk assessment prompt for incident title: {}", title);
        try {
            Resource resource = resourceLoader.getResource("classpath:prompts/gemini-risk-assessment.txt");
            if (!resource.exists()) {
                throw new IOException("Risk template resource file does not exist.");
            }
            
            String template = StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
            String damagesStr = observedDamages != null ? String.join(", ", observedDamages) : "None recorded.";

            return template
                    .replace("{title}", title == null ? "Untitled" : title)
                    .replace("{description}", description == null ? "None" : description)
                    .replace("{category}", category == null ? "OTHER" : category)
                    .replace("{address}", address == null ? "Unknown" : address)
                    .replace("{analysisSummary}", analysisSummary == null ? "None" : analysisSummary)
                    .replace("{observedDamages}", damagesStr);

        } catch (IOException e) {
            log.error("Failed to read risk assessment prompt template from classpath", e);
            throw new RuntimeException("Failed to load risk prompt template", e);
        }
    }
}
