package com.ai.rag;

/**
 * Interface managing retrieval of context from live database objects (RAG) to ground LLM reasoning.
 */
public interface RetrievalService {

    /**
     * Gathers live context for a specific incident report (e.g. details, risk, comments, nearby coordinates).
     */
    String getIncidentRagContext(String incidentId);

    /**
     * Gathers global municipal operations context (e.g. all departments, active backlogs, officer ratings)
     * corresponding to a user's role and conversational query.
     */
    String getGlobalRagContext(String userEmail, String userRole, String userQuery);
}
