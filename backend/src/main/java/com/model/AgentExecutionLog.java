package com.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Audit log recording the operational performance of an individual AI agent.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentExecutionLog {
    private String agentName;
    private String status; // PENDING, RUNNING, COMPLETED, FAILED
    private Long startTime;
    private Long endTime;
    private Long durationMs;
    private Double confidence;
    private String errorMessage;
    private Integer retryCount;
}
