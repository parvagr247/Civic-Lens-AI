package com.controller;

import com.dto.ApiResponse;
import com.dto.CreateIncidentRequest;
import com.dto.IncidentResponse;
import com.dto.AnalysisResponse;
import com.exception.ResourceNotFoundException;
import com.model.Incident;
import com.model.IncidentAnalysis;
import com.repository.IncidentAnalysisRepository;
import com.repository.IncidentRepository;
import com.workflow.IssueAnalysisWorkflow;
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
    private final IncidentRepository incidentRepository;
    private final IncidentAnalysisRepository analysisRepository;

    public IncidentController(
            IssueAnalysisWorkflow analysisWorkflow,
            IncidentRepository incidentRepository,
            IncidentAnalysisRepository analysisRepository) {
        this.analysisWorkflow = analysisWorkflow;
        this.incidentRepository = incidentRepository;
        this.analysisRepository = analysisRepository;
    }

    /**
     * Registers a new civic incident and triggers Gemini Vision AI workflow.
     * Accepts multipart/form-data.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<IncidentResponse>> createIncident(
            @Valid @ModelAttribute CreateIncidentRequest request) {
        log.info("REST: Received request to report a new incident: '{}'", request.getTitle());
        
        IncidentResponse response = analysisWorkflow.processAndAnalyze(request);
        
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
        List<Incident> incidents = incidentRepository.findAll();
        
        List<IncidentResponse> responseList = incidents.stream()
                .map(IncidentResponse::fromEntity)
                .collect(Collectors.toList());

        ApiResponse<List<IncidentResponse>> apiResponse = ApiResponse.success(
                responseList, 
                "Incidents list retrieved successfully.",
                HttpStatus.OK.value()
        );
        return ResponseEntity.ok(apiResponse);
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
