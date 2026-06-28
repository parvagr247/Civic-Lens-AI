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
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;
import java.util.Random;
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
    private final com.repository.AnonymousTrackingFirestoreRepository anonymousRepository;
    private final com.repository.AuditLogFirestoreRepository auditLogRepository;
    private final com.repository.AssignmentFirestoreRepository assignmentRepository;

    public IncidentController(
            IssueAnalysisWorkflow analysisWorkflow,
            RiskAssessmentWorkflow riskAssessmentWorkflow,
            IncidentRepository incidentRepository,
            IncidentAnalysisRepository analysisRepository,
            IncidentService incidentService,
            GamificationService gamificationService,
            UserFirestoreRepository userRepository,
            com.repository.AnonymousTrackingFirestoreRepository anonymousRepository,
            com.repository.AuditLogFirestoreRepository auditLogRepository,
            com.repository.AssignmentFirestoreRepository assignmentRepository) {
        this.analysisWorkflow = analysisWorkflow;
        this.riskAssessmentWorkflow = riskAssessmentWorkflow;
        this.incidentRepository = incidentRepository;
        this.analysisRepository = analysisRepository;
        this.incidentService = incidentService;
        this.gamificationService = gamificationService;
        this.userRepository = userRepository;
        this.anonymousRepository = anonymousRepository;
        this.auditLogRepository = auditLogRepository;
        this.assignmentRepository = assignmentRepository;
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

    public static class OtpRequest {
        public String emailOrPhone;
    }

    public static class OtpVerifyRequest {
        public String emailOrPhone;
        public String otpCode;
    }

    public static class OverrideRequest {
        public String category;
        public String priority;
        public String officerId;
        public String status;
    }

    /**
     * Step 1: Request OTP code for anonymous report filing.
     */
    @PostMapping("/anonymous/request-otp")
    public ResponseEntity<ApiResponse<Map<String, String>>> requestOtp(@RequestBody OtpRequest request) {
        log.info("REST: Generating anonymous tracking OTP for {}", request.emailOrPhone);
        String trackingId = "CL-2026-X" + (10000 + new Random().nextInt(90000));
        String code = String.format("%04d", new Random().nextInt(10000));

        com.model.AnonymousTracking tracking = com.model.AnonymousTracking.builder()
                .id(UUID.randomUUID().toString())
                .trackingId(trackingId)
                .emailOrPhone(request.emailOrPhone)
                .otpCode(code)
                .verified(false)
                .createdAt(System.currentTimeMillis())
                .build();
        anonymousRepository.save(tracking);

        Map<String, String> response = new HashMap<>();
        response.put("trackingId", trackingId);
        response.put("otpCode", code); // Returned directly for simulation ease

        return ResponseEntity.ok(ApiResponse.success(response, "OTP verification code sent", 200));
    }

    /**
     * Step 2: Verify OTP code.
     */
    @PostMapping("/anonymous/verify-otp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyOtp(@RequestBody OtpVerifyRequest request) {
        log.info("REST: Verifying OTP for {}", request.emailOrPhone);
        com.model.AnonymousTracking tracking = anonymousRepository.findByEmailOrPhone(request.emailOrPhone);
        
        if (tracking == null) {
            return ResponseEntity.status(404).body(ApiResponse.success(null, "No tracking session found", 404));
        }

        if (tracking.getOtpCode().equals(request.otpCode)) {
            tracking.setVerified(true);
            anonymousRepository.save(tracking);
            Map<String, Object> data = new HashMap<>();
            data.put("verified", true);
            data.put("trackingId", tracking.getTrackingId());
            return ResponseEntity.ok(ApiResponse.success(data, "OTP verified successfully", 200));
        }

        return ResponseEntity.ok(ApiResponse.success(null, "Invalid OTP code", 400));
    }

    /**
     * Step 3: Submit anonymous report.
     */
    @PostMapping(value = "/anonymous/submit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<IncidentResponse>> submitAnonymous(
            @ModelAttribute CreateIncidentRequest request,
            @RequestParam String trackingId) {
        log.info("REST: Submitting anonymous report with tracking ref: {}", trackingId);

        com.model.AnonymousTracking tracking = anonymousRepository.findByTrackingId(trackingId);
        if (tracking == null || !tracking.getVerified()) {
            return ResponseEntity.status(400).body(ApiResponse.success(null, "Tracking ID not verified", 400));
        }

        // Force anonymous parameters
        request.setAnonymous(true);
        IncidentResponse response = analysisWorkflow.processAndAnalyze(request);

        // Link incident UUID back to tracking record
        tracking.setIncidentId(response.getId());
        anonymousRepository.save(tracking);

        // Update raw incident entity to store the tracking ID
        Incident inc = incidentRepository.findById(response.getId());
        if (inc != null) {
            inc.setTrackingId(trackingId);
            incidentRepository.save(inc);
        }

        // Chain sequential assessment
        try {
            riskAssessmentWorkflow.assessIncidentRisk(response.getId());
        } catch (Exception e) {
            log.error("Risk assessment chain failed", e);
        }

        return ResponseEntity.ok(ApiResponse.success(response, "Anonymous report filed successfully", 200));
    }

    /**
     * Search tracking details by tracking ID.
     */
    @GetMapping("/track/{trackingId}")
    public ResponseEntity<ApiResponse<IncidentResponse>> trackIncident(@PathVariable String trackingId) {
        log.info("REST: Anonymous tracking query for ID: {}", trackingId);
        com.model.AnonymousTracking tracking = anonymousRepository.findByTrackingId(trackingId);
        
        if (tracking == null || tracking.getIncidentId() == null) {
            return ResponseEntity.status(404).body(ApiResponse.success(null, "No report matches this tracking reference", 404));
        }

        Incident incident = incidentRepository.findById(tracking.getIncidentId());
        if (incident == null) {
            return ResponseEntity.status(404).body(ApiResponse.success(null, "Report details missing", 404));
        }

        return ResponseEntity.ok(ApiResponse.success(IncidentResponse.fromEntity(incident), "Report details resolved", 200));
    }

    /**
     * Allows admins to manually override priority, category, officer reassign, and logs in AuditLog.
     */
    @PutMapping("/{id}/override")
    public ResponseEntity<ApiResponse<IncidentResponse>> manualOverride(
            @PathVariable String id,
            @RequestBody OverrideRequest request) {
        log.info("REST: Manual override requested for incident ID: {}", id);

        Incident incident = incidentRepository.findById(id);
        if (incident == null) {
            throw new ResourceNotFoundException("Incident not found.");
        }

        String actorEmail = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();

        // 1. Process category override
        if (request.category != null && !request.category.isEmpty()) {
            String prev = incident.getCategory() != null ? incident.getCategory().name() : "N/A";
            incident.setCategory(com.model.IssueCategory.valueOf(request.category.toUpperCase()));
            auditLogRepository.save(com.model.AuditLog.builder()
                    .id(UUID.randomUUID().toString())
                    .incidentId(id)
                    .actorEmail(actorEmail)
                    .action("OVERRIDE_CATEGORY")
                    .previousValue(prev)
                    .newValue(request.category)
                    .timestamp(System.currentTimeMillis())
                    .build());
        }

        // 2. Process priority / assignment override
        com.model.Assignment assignment = assignmentRepository.findByIncidentId(id);
        if (assignment != null) {
            if (request.priority != null && !request.priority.isEmpty()) {
                String prev = assignment.getPriority() != null ? assignment.getPriority() : "N/A";
                assignment.setPriority(request.priority.toUpperCase());
                assignmentRepository.save(assignment);
                auditLogRepository.save(com.model.AuditLog.builder()
                        .id(UUID.randomUUID().toString())
                        .incidentId(id)
                        .actorEmail(actorEmail)
                        .action("OVERRIDE_PRIORITY")
                        .previousValue(prev)
                        .newValue(request.priority)
                        .timestamp(System.currentTimeMillis())
                        .build());
            }

            if (request.officerId != null && !request.officerId.isEmpty()) {
                String prev = assignment.getOfficerId();
                assignment.setOfficerId(request.officerId);
                assignmentRepository.save(assignment);
                auditLogRepository.save(com.model.AuditLog.builder()
                        .id(UUID.randomUUID().toString())
                        .incidentId(id)
                        .actorEmail(actorEmail)
                        .action("REASSIGN_OFFICER")
                        .previousValue(prev)
                        .newValue(request.officerId)
                        .timestamp(System.currentTimeMillis())
                        .build());
            }
        }

        // 3. Process status override
        if (request.status != null && !request.status.isEmpty()) {
            String prev = incident.getStatus() != null ? incident.getStatus().name() : "N/A";
            incident.setStatus(com.model.IncidentStatus.valueOf(request.status.toUpperCase()));
            auditLogRepository.save(com.model.AuditLog.builder()
                    .id(UUID.randomUUID().toString())
                    .incidentId(id)
                    .actorEmail(actorEmail)
                    .action("OVERRIDE_STATUS")
                    .previousValue(prev)
                    .newValue(request.status)
                    .timestamp(System.currentTimeMillis())
                    .build());
        }

        incidentRepository.save(incident);

        return ResponseEntity.ok(ApiResponse.success(
                IncidentResponse.fromEntity(incident),
                "Parameter overrides executed successfully",
                200
        ));
    }
}
