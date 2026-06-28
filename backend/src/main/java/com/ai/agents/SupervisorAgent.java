package com.ai.agents;

import com.ai.memory.CopilotMemoryStore;
import com.ai.rag.RetrievalService;
import com.service.GeminiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * SupervisorAgent acting as the orchestrator brain.
 * Coordinates RAG retrieval, context building, memory management, and role-based responses.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SupervisorAgent {

    private final GeminiService geminiService;
    private final RetrievalService retrievalService;
    private final CopilotMemoryStore memoryStore;

    /**
     * Orchestrates chat queries using live grounding RAG context.
     *
     * @param userEmail Current user's email.
     * @param userRole Current user's authentication role (CITIZEN, OFFICER, ADMIN).
     * @param query User's natural language question.
     * @return Generated AI copilot response.
     */
    public String chat(String userEmail, String userRole, String query) {
        log.info("Supervisor Agent: Orchestrating chat query from user {} (Role: {})", userEmail, userRole);

        // 1. Get live database context (RAG)
        String ragContext = retrievalService.getGlobalRagContext(userEmail, userRole, query);

        // 2. Fetch history memory
        List<Map<String, String>> history = memoryStore.getHistory(userEmail);
        StringBuilder historyBuilder = new StringBuilder();
        for (Map<String, String> msg : history) {
            historyBuilder.append(String.format("%s: %s\n", msg.get("role"), msg.get("content")));
        }

        // 3. Define role constraints
        String roleConstraints = getRoleSpecificConstraints(userRole);

        // 4. Construct master prompt
        String prompt = String.format(
                "You are the CivicLens Municipal AI Copilot. An intelligent helper ground in live smart city data.\n" +
                "Active User: %s (Role: %s)\n\n" +
                "=== Role Specific Operational Directives ===\n%s\n\n" +
                "=== Live Municipal Database Grounding (RAG) ===\n%s\n\n" +
                "=== Recent Chat History ===\n%s\n\n" +
                "=== New User Message ===\n%s\n\n" +
                "Generate a clear, helpful, markdown formatted response following your directives and grounded in the RAG context.\n" +
                "Assistant Response:",
                userEmail, userRole, roleConstraints, ragContext, historyBuilder.toString(), query
        );

        // 5. Query Gemini & save to memory
        String response = geminiService.callTextModel(prompt);
        
        memoryStore.addMessage(userEmail, "user", query);
        memoryStore.addMessage(userEmail, "assistant", response);

        return response;
    }

    private String getRoleSpecificConstraints(String role) {
        switch (role.toUpperCase()) {
            case "CITIZEN":
                return "- Guide citizens on why their reports might be delayed.\n" +
                       "- Recommend safer travel routes based on pothole hazards.\n" +
                       "- Explain risk scores and summarize community engagement.\n" +
                       "- Do not reveal internal dispatcher notes or budget costs.";
            case "OFFICER":
                return "- Assist officers in prioritizing their active task lists.\n" +
                       "- Summarize instructions and deadlines for their assignments.\n" +
                       "- Help draft professional completion summary reports.\n" +
                       "- Outline routing plans to reach destination coordinates.";
            case "ADMIN":
                return "- Help administrators review officer workloads and departmental completions.\n" +
                       "- Suggest reassignments or identify bottlenecks in SLA performance.\n" +
                       "- Draft city-wide infrastructure policy recommendations.\n" +
                       "- Explain duplicate scores, prediction estimates, and allocation criteria.";
            default:
                return "- Provide general information on registered complaints.";
        }
    }
}
