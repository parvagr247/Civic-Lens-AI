package com.service;

import com.exception.AIException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeTypeUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Service managing communication with the Gemini Vision Model via Spring AI ChatClient.
 * Transmits images and text prompts, parses the response, and handles credentials gracefully.
 */
@Slf4j
@Service
public class GeminiService {

    private final ChatClient chatClient;

    @Value("${spring.ai.google.genai.api-key}")
    private String apiKey;

    public GeminiService(ChatClient chatClient) {
        this.chatClient = chatClient;
    }

    /**
     * Executes Gemini Vision analysis for an uploaded image.
     *
     * @param image      Uploaded image file.
     * @param promptText Structured text prompt instructing the AI's analysis.
     * @return Clean JSON string response.
     */
    public String analyzeImage(MultipartFile image, String promptText) {
        log.info("Gemini Service: Initiating vision analysis request.");

        // Auto-fallback to mock JSON response if API key is not configured
        if ("mock-gemini-key".equalsIgnoreCase(apiKey)) {
            log.warn("Gemini API Key is set to default mock key. Returning a mock JSON response for local testing.");
            return getMockAnalysisJson();
        }

        try {
            log.info("Sending prompt and image to Gemini ChatClient...");
            String response = chatClient.prompt()
                    .user(userSpec -> {
                        userSpec.text(promptText);
                        try {
                            userSpec.media(
                                    MimeTypeUtils.parseMimeType(image.getContentType()),
                                    new org.springframework.core.io.ByteArrayResource(image.getBytes())
                            );
                        } catch (IOException e) {
                            throw new RuntimeException("Failed to read uploaded image bytes", e);
                        }
                    })
                    .call()
                    .content();

            log.info("Successfully received response from Gemini ChatClient.");
            log.debug("Raw Gemini Response: {}", response);
            return cleanJsonResponse(response);
        } catch (Exception e) {
            log.error("Failed to execute Gemini Vision API call", e);
            throw new AIException("Failed to analyze image using Gemini Vision: " + e.getMessage(), e);
        }
    }

    /**
     * Executes a text-based LLM completion using the Gemini ChatClient.
     *
     * @param promptText The structured prompt text.
     * @return Clean JSON string response.
     */
    public String callTextModel(String promptText) {
        log.info("Gemini Service: Initiating text analysis request.");

        // Fallback to mock JSON if API key is not configured
        if ("mock-gemini-key".equalsIgnoreCase(apiKey)) {
            log.warn("Gemini API Key is set to default mock key. Returning a mock risk JSON response for local testing.");
            return getMockRiskJson();
        }

        try {
            log.info("Sending text prompt to Gemini ChatClient...");
            String response = chatClient.prompt()
                    .user(promptText)
                    .call()
                    .content();

            log.info("Successfully received text response from Gemini ChatClient.");
            log.debug("Raw Gemini Response: {}", response);
            return cleanJsonResponse(response);
        } catch (Exception e) {
            log.error("Failed to execute Gemini Text API call", e);
            throw new AIException("Failed to analyze text using Gemini: " + e.getMessage(), e);
        }
    }

    /**
     * Cleans markdown blocks (e.g. ```json ... ```) wrapping the returned JSON payload.
     */
    private String cleanJsonResponse(String response) {
        if (response == null) {
            return "";
        }
        String cleaned = response.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceAll("^```[a-zA-Z]*\\s*", "");
            cleaned = cleaned.replaceAll("\\s*```$", "");
        }
        return cleaned.trim();
    }

    private String getMockAnalysisJson() {
        return "{\n" +
                "  \"category\": \"POTHOLE\",\n" +
                "  \"summary\": \"Mock Report: A deep pothole is observed in the asphalt street road surface.\",\n" +
                "  \"observedDamages\": [\n" +
                "    \"Structural asphalt failure\",\n" +
                "    \"Cracked surrounding pavement\",\n" +
                "    \"Loose road debris and aggregate\"\n" +
                "  ],\n" +
                "  \"likelyCause\": \"Road wear and tear aggravated by traffic loads and thermal expanding water infiltration.\",\n" +
                "  \"confidence\": 0.94,\n" +
                "  \"recommendedAction\": \"Clean debris, seal surrounding joints, and patch with heavy asphalt mix.\",\n" +
                "  \"reasoning\": \"The pothole is deep with visible base deterioration, posing an immediate hazard to traffic.\"\n" +
                "}";
    }

    private String getMockRiskJson() {
        return "{\n" +
                "  \"overallRiskScore\": 78,\n" +
                "  \"severity\": \"MAJOR\",\n" +
                "  \"urgency\": \"WITHIN_24_HOURS\",\n" +
                "  \"confidence\": 0.92,\n" +
                "  \"priority\": \"P2\",\n" +
                "  \"threatLevel\": \"HIGH\",\n" +
                "  \"estimatedResolutionTime\": \"24 Hours\",\n" +
                "  \"affectedPopulation\": 650,\n" +
                "  \"affectedDepartments\": [\"Public Works\", \"Traffic Management\"],\n" +
                "  \"potentialEscalation\": \"High vehicle impact could expand the depression, cracking adjacent subgrade pavement and causing a collapse.\",\n" +
                "  \"publicSafetyImpact\": \"High hazard to cyclists and sudden braking from drivers, potentially leading to rear-end collisions.\",\n" +
                "  \"infrastructureImpact\": \"Localized asphalt wearing and aggregate displacement down to road base course layers.\",\n" +
                "  \"environmentalImpact\": \"Water retention within pothole could accelerate subgrade erosion during rainy conditions.\",\n" +
                "  \"accessibilityImpact\": \"Pedestrian and visual warnings are required as wheelchair ramps could be obstructed by sudden repair diversions.\",\n" +
                "  \"reasoning\": \"The reported issue is located in an active traffic lane with high traffic volume (100+ vehicles/min) and severe surface damage.\",\n" +
                "  \"recommendations\": [\n" +
                "    \"Erect warning pylons and safety signs around the hazard area.\",\n" +
                "    \"Deploy emergency cold patch repair within 24 hours.\",\n" +
                "    \"Schedule full lane resurfacing during the next local utility maintenance window.\"\n" +
                "  ]\n" +
                "}";
    }
}
