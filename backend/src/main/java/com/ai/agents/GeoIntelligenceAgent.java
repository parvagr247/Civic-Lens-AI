package com.ai.agents;

import com.service.GeminiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Agent specialized in spatial GIS calculations, analyzing proximity to schools, hospitals, and hazard zones.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GeoIntelligenceAgent implements BaseAgent {

    private final GeminiService geminiService;

    @Override
    public String getName() {
        return "GeoIntelligenceAgent";
    }

    @Override
    public String execute(String context) {
        log.info("Geo Agent: Evaluating GIS proximity parameters.");
        String prompt = "You are the Geo-Spatial Intelligence Agent.\n" +
                "Given the calculated nearby landmark metrics and coordinate logs:\n" +
                context + "\n" +
                "Format this data into a structured JSON payload for GIS integration matching:\n" +
                "{\n" +
                "  \"nearbySchool\": {\n" +
                "    \"name\": \"...\",\n" +
                "    \"distanceMeters\": 120\n" +
                "  },\n" +
                "  \"nearbyHospital\": {\n" +
                "    \"name\": \"...\",\n" +
                "    \"distanceMeters\": 350\n" +
                "  },\n" +
                "  \"criticalInfrastructure\": {\n" +
                "    \"name\": \"...\",\n" +
                "    \"distanceMeters\": 400\n" +
                "  },\n" +
                "  \"highTrafficZone\": true,\n" +
                "  \"floodZone\": \"LOW\",\n" +
                "  \"nightVisibility\": \"LOW\",\n" +
                "  \"confidence\": 0.95,\n" +
                "  \"reasoning\": \"...\"\n" +
                "}\n" +
                "Do not include other markdown wrapping, output only valid JSON.";
        return geminiService.callTextModel(prompt);
    }
}
