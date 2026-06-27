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
}
