package com.configuration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class for Spring AI Gemini Integration.
 * Builds and registers the ChatClient interface to interact with Gemini 2.5 Flash.
 */
@Slf4j
@Configuration
public class GeminiConfiguration {

    /**
     * Exposes ChatClient using the auto-configured Google GenAI ChatModel.
     * This client will handle text parsing, prompt formatting, and structured output.
     */
    @Bean
    public ChatClient chatClient(ChatModel chatModel) {
        log.info("Initializing Spring AI ChatClient using Google Gemini model.");
        return ChatClient.builder(chatModel)
                .defaultSystem("You are CivicLens AI, an advanced municipal intelligence copilot designed for city administrators. Always output accurate, data-driven, and objective civic risk intelligence.")
                .build();
    }
}
