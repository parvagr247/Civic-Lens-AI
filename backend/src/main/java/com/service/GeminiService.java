package com.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * Service interface managing communication with the Gemini AI model.
 */
public interface GeminiService {

    /**
     * Executes Gemini Vision analysis for an uploaded image.
     *
     * @param image      Uploaded image file.
     * @param promptText Structured text prompt instructing the AI's analysis.
     * @return Clean JSON string response.
     */
    String analyzeImage(MultipartFile image, String promptText);

    /**
     * Executes a text-based LLM completion using the Gemini ChatClient.
     *
     * @param promptText The structured prompt text.
     * @return Clean JSON string response.
     */
    String callTextModel(String promptText);
}
