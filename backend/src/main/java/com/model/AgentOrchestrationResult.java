package com.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Domain entity representing the unified output of the Multi-Agent Orchestration process.
 * Maps directly to documents in the Firestore 'agent_orchestration_results' collection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentOrchestrationResult {
    private String id; // Matches incidentId
    private String incidentId;
    private String status; // RUNNING, COMPLETED, FAILED
    
    // Agent Outputs (Structured JSON strings)
    private String visionOutput;       // Category, observed damages, confidence
    private String geoOutput;          // Nearby facilities, GIS coordinates
    private String duplicateOutput;    // Duplicate score, merged incident ID, decision
    private String trustOutput;        // Spam score, authenticity, user reputation
    private String riskOutput;         // Risk score, urgency, priority, safety impact
    private String predictionOutput;   // Future escalation probability, closure prediction
    private String dispatcherOutput;   // Actionable plan, required departments, resources
    private String explainabilityOutput;// AI evidence footnotes and decision logic reasoning
    private String recommendationOutput;// Recommended long-term remediation actions

    
    private Double finalConfidence;
    private List<AgentExecutionLog> executionLogs;
    private List<String> knowledgeGraphRelationships;
    private Long startedAt;
    private Long completedAt;
}
