package com.ai.agents;

/**
 * Base contract implemented by all specialized AI agents.
 */
public interface BaseAgent {
    
    /**
     * Unique name identifier of the agent.
     */
    String getName();

    /**
     * Executes the task-specific agent reasoning given retrieved RAG context.
     *
     * @param context Retrieved project metadata.
     * @return Markdown/JSON response string.
     */
    String execute(String context);
}
