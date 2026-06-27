package com.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Utility builder class that loads and populates AI prompt templates from classpath resources.
 */
@Slf4j
@Component
public class PromptBuilder {

    private final ResourceLoader resourceLoader;

    public PromptBuilder(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    /**
     * Loads the vision analysis prompt template and injects description metadata.
     */
    public String buildVisionAnalysisPrompt(String description) {
        log.debug("Building vision analysis prompt with description: {}", description);
        try {
            Resource resource = resourceLoader.getResource("classpath:prompts/gemini-vision-analysis.txt");
            if (!resource.exists()) {
                throw new IOException("Prompt template resource file does not exist.");
            }
            String template = StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
            return template.replace("{description}", description == null ? "No description provided." : description);
        } catch (IOException e) {
            log.error("Failed to read vision analysis prompt template from classpath", e);
            throw new RuntimeException("Failed to load prompt template", e);
        }
    }
}
