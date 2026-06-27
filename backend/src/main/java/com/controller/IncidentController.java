package com.controller;

import com.dto.ApiResponse;
import com.dto.CreateIncidentRequest;
import com.dto.IncidentResponse;
import com.dto.AnalysisResponse;
import com.exception.ResourceNotFoundException;
import com.model.Incident;
import com.model.IncidentAnalysis;
import com.model.User;
import com.repository.IncidentAnalysisRepository;
import com.repository.IncidentRepository;
import com.repository.UserFirestoreRepository;
import com.service.GamificationService;
import com.service.IncidentService;
import com.workflow.IssueAnalysisWorkflow;
import com.workflow.RiskAssessmentWorkflow;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * REST controller for managing civic incidents and their AI analysis.
 */
@Slf4j
@RestController
@RequestMapping("/api/issues")
public class IncidentController {

    private final IssueAnalysisWorkflow analysisWorkflow;
    private final RiskAssessmentWorkflow riskAssessmentWorkflow;
    private final IncidentRepository incidentRepository;
    private final IncidentAnalysisRepository analysisRepository;
    private final IncidentService incidentService;
    private final GamificationService gamificationService;
    private final UserFirestoreRepository userRepository;

    public IncidentController(
            IssueAnalysisWorkflow analysisWorkflow,
            RiskAssessmentWorkflow riskAssessmentWorkflow,
            IncidentRepository incidentRepository,
            IncidentAnalysisRepository analysisRepository,
            IncidentService incidentService,
            GamificationService gamificationService,
            UserFirestoreRepository userRepository) {
        this.analysisWorkflow = analysisWorkflow;
        this.riskAssessmentWorkflow = riskAssessmentWorkflow;
        this.incidentRepository = incidentRepository;
        this.analysisRepository = analysisRepository;
        this.incidentService = incidentService;
        this.gamificationService = gamificationService;
        this.userRepository = userRepository;
    }

    /**
     * Registers a new civic incident, triggers Gemini Vision AI, and chains risk analysis.
     * Accepts multipart/form-data.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<IncidentResponse>> createIncident(
            @Valid @ModelAttribute CreateIncidentRequest request) {
        log.info("REST: Received request to report a new incident: '{}'", request.getTitle());
        
        IncidentResponse response = analysisWorkflow.processAndAnalyze(request);

        // Chain the RiskAssessmentWorkflow sequentially
        try {
            riskAssessmentWorkflow.assessIncidentRisk(response.getId());
            log.info("Workflow chaining: Successfully executed risk assessment for incident {}", response.getId());
        } catch (Exception e) {
            log.error("Workflow chaining warning: Failed to assess risk for incident {}", response.getId(), e);
        }

        // Chain the Gamification points allocation
        try {
            String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByEmail(email);
            if (user != null) {
                gamificationService.rewardPoints(user.getId(), "REPORT_FILED", response.getId());
                log.info("Gamification: Points rewarded successfully to citizen: {}", user.getEmail());
            }
        } catch (Exception e) {
            log.warn("Gamification warning: Failed to reward points to reporter: {}", e.getMessage());
        }
        
        ApiResponse<IncidentResponse> apiResponse = ApiResponse.success(
                response, 
                "Incident reported and analyzed successfully.",
                HttpStatus.CREATED.value()
        );
        return new ResponseEntity<>(apiResponse, HttpStatus.CREATED);
    }

    /**
     * Lists all registered incidents ordered by creation date descending.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<IncidentResponse>>> getAllIncidents() {
        log.info("REST: Received request to list all incidents.");
        List<IncidentResponse> responseList = incidentService.getAllIncidents();

        ApiResponse<List<IncidentResponse>> apiResponse = ApiResponse.success(
                responseList, 
                "Incidents list retrieved successfully.",
                HttpStatus.OK.value()
        );
        return ResponseEntity.ok(apiResponse);
    }

    /**
     * Updates the status of an incident. Exposes PATCH /api/issues/{id}/status.
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<IncidentResponse>> updateStatus(
            @PathVariable String id,
            @RequestParam String status) {
        log.info("REST: Received request to update status of incident {} to {}", id, status);
        IncidentResponse response = incidentService.updateIncidentStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success(
                response,
                "Incident status updated successfully.",
                HttpStatus.OK.value()
        ));
    }

    /**
     * Retrieves detail information of a specific incident.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<IncidentResponse>> getIncidentById(
            @PathVariable String id) {
        log.info("REST: Received request to retrieve incident ID: {}", id);
        Incident incident = incidentRepository.findById(id);
        
        if (incident == null) {
            throw new ResourceNotFoundException("Incident not found with ID: " + id);
        }

        ApiResponse<IncidentResponse> apiResponse = ApiResponse.success(
                IncidentResponse.fromEntity(incident), 
                "Incident details retrieved successfully.",
                HttpStatus.OK.value()
        );
        return ResponseEntity.ok(apiResponse);
    }

    /**
     * Retrieves AI vision analysis results for a specific incident.
     */
    @GetMapping("/{id}/analysis")
    public ResponseEntity<ApiResponse<AnalysisResponse>> getIncidentAnalysis(
            @PathVariable String id) {
        log.info("REST: Received request to retrieve AI analysis for incident ID: {}", id);
        
        // Ensure incident exists
        Incident incident = incidentRepository.findById(id);
        if (incident == null) {
            throw new ResourceNotFoundException("Incident not found with ID: " + id);
        }

        IncidentAnalysis analysis = analysisRepository.findByIncidentId(id);
        if (analysis == null) {
            throw new ResourceNotFoundException("No AI analysis report found for incident ID: " + id);
        }

        ApiResponse<AnalysisResponse> apiResponse = ApiResponse.success(
                AnalysisResponse.fromEntity(analysis), 
                "Incident AI analysis retrieved successfully.",
                HttpStatus.OK.value()
        );
        return ResponseEntity.ok(apiResponse);
    }
}
