package com.ai.memory;

import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thread-safe in-memory memory store to track chat conversation history for role-based AI Copilots.
 */
@Component
public class CopilotMemoryStore {

    // Map of userEmail -> List of chat message maps: { "role": "user/assistant", "content": "..." }
    private final Map<String, List<Map<String, String>>> sessionMemory = new ConcurrentHashMap<>();

    /**
     * Retrieve chat history messages for a specific user.
     */
    public List<Map<String, String>> getHistory(String userEmail) {
        return sessionMemory.getOrDefault(userEmail, new ArrayList<>());
    }

    /**
     * Append a message to the user's active session memory.
     */
    public void addMessage(String userEmail, String sender, String text) {
        List<Map<String, String>> history = sessionMemory.computeIfAbsent(userEmail, k -> new ArrayList<>());
        
        Map<String, String> msg = new HashMap<>();
        msg.put("role", sender);
        msg.put("content", text);
        history.add(msg);

        // Keep a max context window of 20 messages to prevent token window overflow
        if (history.size() > 20) {
            history.remove(0);
        }
    }

    /**
     * Clear conversation history for a specific user.
     */
    public void clearHistory(String userEmail) {
        sessionMemory.remove(userEmail);
    }
}
