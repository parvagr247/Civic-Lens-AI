package com.workflow;

import com.dto.RiskAssessmentResponse;
import com.mapper.RiskAssessmentMapper;
import com.model.RiskAssessment;
import com.service.RiskAssessmentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Enterprise workflow orchestrator for calculating municipal risk assessments.
 * Isolates decision-support logic from issue classification pipelines.
 */
@Slf4j
@Component
public class RiskAssessmentWorkflow {

    private final RiskAssessmentService riskAssessmentService;
    private final RiskAssessmentMapper riskAssessmentMapper;

    public RiskAssessmentWorkflow(
            RiskAssessmentService riskAssessmentService,
            RiskAssessmentMapper riskAssessmentMapper) {
        this.riskAssessmentService = riskAssessmentService;
        this.riskAssessmentMapper = riskAssessmentMapper;
    }

    /**
     * Orchestrates risk assessment computation for a reported incident.
     *
     * @param incidentId Unique incident UUID.
     * @return RiskAssessmentResponse mapped response payload.
     */
    public RiskAssessmentResponse assessIncidentRisk(String incidentId) {
        log.info("Workflow: Initiating RiskAssessmentWorkflow for Incident: {}", incidentId);
        
        RiskAssessment assessment = riskAssessmentService.assessIncidentRisk(incidentId);
        
        log.info("Workflow: RiskAssessmentWorkflow completed successfully for Incident: {}", incidentId);
        return riskAssessmentMapper.toResponse(assessment);
    }
}
