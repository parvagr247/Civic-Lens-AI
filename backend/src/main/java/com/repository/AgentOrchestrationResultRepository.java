package com.repository;

import com.google.cloud.firestore.Firestore;
import com.model.AgentOrchestrationResult;
import org.springframework.stereotype.Repository;

/**
 * Firestore repository handler for agent orchestration results.
 */
@Repository
public class AgentOrchestrationResultRepository extends BaseFirestoreRepository<AgentOrchestrationResult> {

    public AgentOrchestrationResultRepository(Firestore firestore) {
        super(firestore, "agent_orchestration_results");
    }

    /**
     * Retrieves the orchestration outputs for a specific incident.
     */
    public AgentOrchestrationResult findByIncidentId(String incidentId) {
        return findById(incidentId, AgentOrchestrationResult.class);
    }
}
