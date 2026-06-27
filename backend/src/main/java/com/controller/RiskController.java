package com.controller;

import com.dto.ApiResponse;
import com.dto.RiskAssessmentResponse;
import com.dto.RiskStatisticsResponse;
import com.mapper.RiskAssessmentMapper;
import com.model.RiskAssessment;
import com.service.RiskAssessmentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * REST controller for managing municipal risk assessments and dashboards.
 */
@Slf4j
@RestController
@RequestMapping("/api")
public class RiskController {

    private final RiskAssessmentService riskAssessmentService;
    private final RiskAssessmentMapper riskAssessmentMapper;

    public RiskController(
            RiskAssessmentService riskAssessmentService,
            RiskAssessmentMapper riskAssessmentMapper) {
        this.riskAssessmentService = riskAssessmentService;
        this.riskAssessmentMapper = riskAssessmentMapper;
    }

    /**
     * Retrieves the risk assessment score card details for a specific incident.
     */
    @GetMapping("/issues/{id}/risk")
    public ResponseEntity<ApiResponse<RiskAssessmentResponse>> getRiskByIncidentId(
            @PathVariable String id) {
        log.info("REST: Received request to retrieve risk assessment for incident: {}", id);
        
        RiskAssessment assessment = riskAssessmentService.getRiskByIncidentId(id);
        RiskAssessmentResponse response = riskAssessmentMapper.toResponse(assessment);

        return ResponseEntity.ok(ApiResponse.success(
                response, 
                "Risk assessment details retrieved successfully.", 
                HttpStatus.OK.value()
        ));
    }

    /**
     * Triggers manual AI risk assessment re-analysis for a specific incident.
     */
    @PostMapping("/issues/{id}/risk/reanalyze")
    public ResponseEntity<ApiResponse<RiskAssessmentResponse>> reanalyzeRisk(
            @PathVariable String id) {
        log.info("REST: Received request to re-analyze risk for incident: {}", id);
        
        RiskAssessment assessment = riskAssessmentService.reanalyzeRisk(id);
        RiskAssessmentResponse response = riskAssessmentMapper.toResponse(assessment);

        return ResponseEntity.ok(ApiResponse.success(
                response, 
                "Incident risk re-analyzed successfully.", 
                HttpStatus.OK.value()
        ));
    }

    /**
     * Lists all high-risk assessments (overall score >= 60).
     */
    @GetMapping("/risk/high")
    public ResponseEntity<ApiResponse<List<RiskAssessmentResponse>>> getHighRiskIncidents() {
        log.info("REST: Received request to list high risk incidents.");
        
        List<RiskAssessment> highRisk = riskAssessmentService.getHighRiskAssessments();
        List<RiskAssessmentResponse> responseList = highRisk.stream()
                .map(riskAssessmentMapper::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(
                responseList, 
                "High risk incidents list retrieved successfully.", 
                HttpStatus.OK.value()
        ));
    }

    /**
     * Retrieves city-wide risk diagnostics and priority distribution statistics.
     */
    @GetMapping("/risk/statistics")
    public ResponseEntity<ApiResponse<RiskStatisticsResponse>> getStatistics() {
        log.info("REST: Received request to retrieve city-wide risk statistics.");
        
        RiskStatisticsResponse response = riskAssessmentService.getStatistics();

        return ResponseEntity.ok(ApiResponse.success(
                response, 
                "City risk statistics retrieved successfully.", 
                HttpStatus.OK.value()
        ));
    }
}
