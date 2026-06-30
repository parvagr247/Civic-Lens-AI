package com.controller;

import com.dto.ApiResponse;
import com.dto.CreateIncidentRequest;
import com.dto.IncidentResponse;
import com.dto.AnalysisResponse;
import com.dto.IncidentQueueItem;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Set;
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
    private final com.repository.OfficerFirestoreRepository officerRepository;
    private final com.repository.RiskAssessmentRepository riskAssessmentRepository;

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
            com.repository.AssignmentFirestoreRepository assignmentRepository,
            com.repository.OfficerFirestoreRepository officerRepository,
            com.repository.RiskAssessmentRepository riskAssessmentRepository) {
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
        this.officerRepository = officerRepository;
        this.riskAssessmentRepository = riskAssessmentRepository;
    }

    /**
     * Registers a new civic incident, triggers Gemini Vision AI, and chains risk analysis.
     * Accepts multipart/form-data.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<IncidentResponse>> createIncident(
            @Valid @ModelAttribute CreateIncidentRequest request) {
        log.info("REST: Received request to report a new incident: '{}'", request.getTitle());
        
        org.springframework.web.multipart.MultipartFile imageFile = request.getImage();
        if (imageFile == null) {
            throw new com.exception.ValidationException("Incident image file is required (null received).");
        }
        if (imageFile.isEmpty()) {
            throw new com.exception.ValidationException("Incident image file is empty.");
        }
        log.info("Received image file metadata: filename='{}', contentType='{}', size={} bytes",
                imageFile.getOriginalFilename(), imageFile.getContentType(), imageFile.getSize());
        
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
     * Toggles support (upvote) for a specific incident.
     */
    @PostMapping("/{id}/support")
    public ResponseEntity<ApiResponse<IncidentResponse>> toggleSupport(@PathVariable String id) {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("REST: Toggle support for incident {} by user {}", id, email);
        IncidentResponse response = incidentService.toggleSupport(id, email);
        return ResponseEntity.ok(ApiResponse.success(
                response,
                "Incident support status updated successfully.",
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
        public Boolean hidden;
        public Boolean pinned;
        public Boolean locked;
        public Boolean escalated;
        public Double spamScore;
        public String moderator;
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

        // 4. Process moderation overrides
        if (request.hidden != null) {
            incident.setHidden(request.hidden);
        }
        if (request.pinned != null) {
            incident.setPinned(request.pinned);
        }
        if (request.locked != null) {
            incident.setLocked(request.locked);
        }
        if (request.escalated != null) {
            incident.setEscalated(request.escalated);
        }
        if (request.spamScore != null) {
            incident.setSpamScore(request.spamScore);
        }
        if (request.moderator != null) {
            incident.setModerator(request.moderator);
        }

        incidentRepository.save(incident);

        return ResponseEntity.ok(ApiResponse.success(
                IncidentResponse.fromEntity(incident),
                "Parameter overrides executed successfully",
                200
        ));
    }

    @GetMapping("/queue")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getIncidentQueue(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean resolved,
            @RequestParam(required = false) Boolean unassigned,
            @RequestParam(required = false) Boolean duplicate,
            @RequestParam(required = false) Boolean requiresReview,
            @RequestParam(required = false) Boolean highRisk) {

        log.info("Queue REST: Fetching queue page={}, size={}, sort={}", page, size, sort);

        List<Incident> incidents = incidentRepository.findAll();
        List<com.model.Assignment> assignments = assignmentRepository.findAll();
        List<com.model.RiskAssessment> riskAssessments = riskAssessmentRepository.findAll();
        List<com.model.Officer> officers = officerRepository.findAll();

        Map<String, com.model.Assignment> assignmentMap = assignments.stream()
                .filter(a -> a.getIncidentId() != null)
                .collect(Collectors.toMap(com.model.Assignment::getIncidentId, a -> a, (a1, a2) -> a1));

        Map<String, com.model.RiskAssessment> riskMap = riskAssessments.stream()
                .filter(r -> r.getIncidentId() != null)
                .collect(Collectors.toMap(com.model.RiskAssessment::getIncidentId, r -> r, (r1, r2) -> r1));

        Map<String, com.model.Officer> officerMap = officers.stream()
                .filter(o -> o.getId() != null)
                .collect(Collectors.toMap(com.model.Officer::getId, o -> o, (o1, o2) -> o1));

        List<IncidentQueueItem> items = new ArrayList<>();

        for (Incident i : incidents) {
            com.model.Assignment a = assignmentMap.get(i.getId());
            com.model.RiskAssessment r = riskMap.get(i.getId());

            String priorityVal = "P3";
            String officerName = "Unassigned";
            String dept = "Unassigned";
            int riskScore = 0;
            double confidence = 0.0;

            if (a != null) {
                priorityVal = a.getPriority() != null ? a.getPriority() : "P3";
                officerName = a.getOfficerName() != null ? a.getOfficerName() : "Unassigned";
                if (a.getDepartment() != null) {
                    dept = a.getDepartment();
                } else if (a.getOfficerId() != null) {
                    com.model.Officer o = officerMap.get(a.getOfficerId());
                    if (o != null && o.getDepartment() != null) {
                        dept = o.getDepartment();
                    }
                }
            }

            if (r != null) {
                riskScore = r.getOverallRiskScore() != null ? r.getOverallRiskScore() : 0;
                confidence = r.getConfidence() != null ? r.getConfidence() : 0.0;
                if (dept.equals("Unassigned") && r.getAffectedDepartments() != null && !r.getAffectedDepartments().isEmpty()) {
                    dept = r.getAffectedDepartments().get(0);
                }
                if (a == null && r.getPriority() != null) {
                    priorityVal = r.getPriority().name();
                }
            }

            String locationText = i.getLocation() != null ? i.getLocation().getAddress() : "Unknown Sector";

            items.add(IncidentQueueItem.builder()
                    .id(i.getId())
                    .title(i.getTitle())
                    .status(i.getStatus())
                    .category(i.getCategory())
                    .priority(priorityVal)
                    .location(locationText)
                    .reportedBy(i.getReportedBy())
                    .assignedDepartment(dept)
                    .assignedOfficer(officerName)
                    .riskScore(riskScore)
                    .aiConfidence(confidence)
                    .hidden(i.getHidden())
                    .pinned(i.getPinned())
                    .locked(i.getLocked())
                    .escalated(i.getEscalated())
                    .spamScore(i.getSpamScore())
                    .moderator(i.getModerator())
                    .createdAt(i.getCreatedAt() != null ? i.getCreatedAt() : 0L)
                    .updatedAt(i.getUpdatedAt() != null ? i.getUpdatedAt() : 0L)
                    .build());
        }

        // Apply Filters
        List<IncidentQueueItem> filteredItems = items.stream().filter(item -> {
            if (status != null && !status.trim().isEmpty() && !item.getStatus().name().equalsIgnoreCase(status)) return false;
            if (priority != null && !priority.trim().isEmpty() && !item.getPriority().equalsIgnoreCase(priority)) return false;
            if (department != null && !department.trim().isEmpty() && !item.getAssignedDepartment().equalsIgnoreCase(department)) return false;
            if (category != null && !category.trim().isEmpty() && !item.getCategory().name().equalsIgnoreCase(category)) return false;
            if (city != null && !city.trim().isEmpty() && !item.getLocation().toLowerCase().contains(city.toLowerCase())) return false;
            
            if (resolved != null && resolved && item.getStatus() != com.model.IncidentStatus.RESOLVED) return false;
            if (unassigned != null && unassigned && !"Unassigned".equalsIgnoreCase(item.getAssignedOfficer())) return false;
            if (highRisk != null && highRisk && item.getRiskScore() < 70) return false;
            if (requiresReview != null && requiresReview && item.getAiConfidence() >= 0.65 && item.getStatus() != com.model.IncidentStatus.UNDER_REVIEW) return false;
            if (duplicate != null && duplicate && !item.getTitle().toLowerCase().contains("duplicate") && !item.getTitle().toLowerCase().contains("copy")) return false;

            if (search != null && !search.trim().isEmpty()) {
                String s = search.toLowerCase();
                boolean matches = item.getId().toLowerCase().contains(s)
                        || item.getTitle().toLowerCase().contains(s)
                        || (item.getReportedBy() != null && item.getReportedBy().toLowerCase().contains(s))
                        || item.getLocation().toLowerCase().contains(s);
                if (!matches) return false;
            }

            return true;
        }).collect(Collectors.toList());

        // Apply Sorting
        Comparator<IncidentQueueItem> comparator = (item1, item2) -> {
            if ("createdAt".equalsIgnoreCase(sort) || "newest".equalsIgnoreCase(sort)) {
                return Long.compare(item2.getCreatedAt(), item1.getCreatedAt());
            } else if ("oldest".equalsIgnoreCase(sort)) {
                return Long.compare(item1.getCreatedAt(), item2.getCreatedAt());
            } else if ("risk".equalsIgnoreCase(sort) || "highestRisk".equalsIgnoreCase(sort)) {
                return Integer.compare(item2.getRiskScore(), item1.getRiskScore());
            } else if ("lowestRisk".equalsIgnoreCase(sort)) {
                return Integer.compare(item1.getRiskScore(), item2.getRiskScore());
            } else if ("confidence".equalsIgnoreCase(sort)) {
                return Double.compare(item2.getAiConfidence(), item1.getAiConfidence());
            } else if ("updatedAt".equalsIgnoreCase(sort)) {
                return Long.compare(item2.getUpdatedAt(), item1.getUpdatedAt());
            }
            return Long.compare(item2.getCreatedAt(), item1.getCreatedAt());
        };

        if ("asc".equalsIgnoreCase(direction)) {
            comparator = comparator.reversed();
        }

        filteredItems.sort(comparator);

        // Paginate
        int totalElements = filteredItems.size();
        int start = page * size;
        int end = Math.min(start + size, totalElements);
        List<IncidentQueueItem> content = new ArrayList<>();
        if (start < totalElements) {
            content = filteredItems.subList(start, end);
        }

        int totalPages = (int) Math.ceil((double) totalElements / size);

        Map<String, Object> data = new HashMap<>();
        data.put("content", content);
        data.put("totalElements", totalElements);
        data.put("totalPages", totalPages);
        data.put("page", page);
        data.put("size", size);

        return ResponseEntity.ok(ApiResponse.success(data, "Incident queue retrieved successfully.", 200));
    }

    @PostMapping("/bulk/assign-department")
    public ResponseEntity<ApiResponse<Void>> bulkAssignDepartment(@RequestBody Map<String, Object> body) {
        List<String> ids = (List<String>) body.get("incidentIds");
        String dept = (String) body.get("department");
        log.info("Bulk Assign Department: count={}, dept={}", ids.size(), dept);

        for (String id : ids) {
            Incident incident = incidentRepository.findById(id);
            if (incident != null) {
                if (incident.getStatus() == com.model.IncidentStatus.REPORTED) {
                    incident.setStatus(com.model.IncidentStatus.ASSIGNED);
                    incidentRepository.save(incident);
                }
                com.model.Assignment a = assignmentRepository.findByIncidentId(id);
                if (a == null) {
                    a = com.model.Assignment.builder()
                            .id(UUID.randomUUID().toString())
                            .incidentId(id)
                            .department(dept)
                            .assignedAt(System.currentTimeMillis())
                            .priority("P3")
                            .status("ASSIGNED")
                            .build();
                } else {
                    a.setDepartment(dept);
                    a.setUpdatedAt(System.currentTimeMillis());
                }
                assignmentRepository.save(a);
            }
        }
        return ResponseEntity.ok(ApiResponse.success(null, "Bulk department assignment complete.", 200));
    }

    @PostMapping("/bulk/assign-officer")
    public ResponseEntity<ApiResponse<Void>> bulkAssignOfficer(@RequestBody Map<String, Object> body) {
        List<String> ids = (List<String>) body.get("incidentIds");
        String officerId = (String) body.get("officerId");
        log.info("Bulk Assign Officer: count={}, officerId={}", ids.size(), officerId);

        com.model.Officer officer = officerRepository.findById(officerId);
        if (officer == null) {
            throw new ResourceNotFoundException("Officer not found");
        }

        for (String id : ids) {
            Incident incident = incidentRepository.findById(id);
            if (incident != null) {
                incident.setStatus(com.model.IncidentStatus.INVESTIGATING);
                incidentRepository.save(incident);

                com.model.Assignment a = assignmentRepository.findByIncidentId(id);
                if (a == null) {
                    a = com.model.Assignment.builder()
                            .id(UUID.randomUUID().toString())
                            .incidentId(id)
                            .officerId(officerId)
                            .officerName(officer.getName())
                            .department(officer.getDepartment())
                            .assignedAt(System.currentTimeMillis())
                            .priority("P3")
                            .status("ASSIGNED")
                            .build();
                } else {
                    a.setOfficerId(officerId);
                    a.setOfficerName(officer.getName());
                    a.setDepartment(officer.getDepartment());
                    a.setUpdatedAt(System.currentTimeMillis());
                }
                assignmentRepository.save(a);
            }
        }
        return ResponseEntity.ok(ApiResponse.success(null, "Bulk officer assignment complete.", 200));
    }

    @PostMapping("/bulk/change-status")
    public ResponseEntity<ApiResponse<Void>> bulkChangeStatus(@RequestBody Map<String, Object> body) {
        List<String> ids = (List<String>) body.get("incidentIds");
        String statusStr = (String) body.get("status");
        log.info("Bulk Status Change: count={}, status={}", ids.size(), statusStr);

        com.model.IncidentStatus status = com.model.IncidentStatus.valueOf(statusStr.toUpperCase());
        for (String id : ids) {
            Incident incident = incidentRepository.findById(id);
            if (incident != null) {
                incident.setStatus(status);
                incident.setUpdatedAt(System.currentTimeMillis());
                incidentRepository.save(incident);
            }
        }
        return ResponseEntity.ok(ApiResponse.success(null, "Bulk status changes complete.", 200));
    }

    @PostMapping("/bulk/close")
    public ResponseEntity<ApiResponse<Void>> bulkClose(@RequestBody Map<String, Object> body) {
        List<String> ids = (List<String>) body.get("incidentIds");
        log.info("Bulk Close: count={}", ids.size());

        for (String id : ids) {
            Incident incident = incidentRepository.findById(id);
            if (incident != null) {
                incident.setStatus(com.model.IncidentStatus.RESOLVED);
                incident.setClosedAt(System.currentTimeMillis());
                incident.setUpdatedAt(System.currentTimeMillis());
                incidentRepository.save(incident);
            }
        }
        return ResponseEntity.ok(ApiResponse.success(null, "Bulk close complete.", 200));
    }

    @PostMapping("/bulk/merge-duplicates")
    public ResponseEntity<ApiResponse<Void>> bulkMergeDuplicates(@RequestBody Map<String, Object> body) {
        List<String> ids = (List<String>) body.get("incidentIds");
        log.info("Bulk Merge Duplicates: count={}", ids.size());

        if (ids.size() > 1) {
            Incident master = incidentRepository.findById(ids.get(0));
            if (master != null) {
                for (int i = 1; i < ids.size(); i++) {
                    Incident dup = incidentRepository.findById(ids.get(i));
                    if (dup != null) {
                        dup.setTitle("[DUPLICATE] " + dup.getTitle());
                        dup.setStatus(com.model.IncidentStatus.RESOLVED);
                        dup.setClosedAt(System.currentTimeMillis());
                        dup.setUpdatedAt(System.currentTimeMillis());
                        incidentRepository.save(dup);
                    }
                }
            }
        }
        return ResponseEntity.ok(ApiResponse.success(null, "Duplicates merged successfully.", 200));
    }

    @PostMapping("/bulk/mark-verified")
    public ResponseEntity<ApiResponse<Void>> bulkMarkVerified(@RequestBody Map<String, Object> body) {
        List<String> ids = (List<String>) body.get("incidentIds");
        log.info("Bulk Mark Verified: count={}", ids.size());

        for (String id : ids) {
            Incident incident = incidentRepository.findById(id);
            if (incident != null) {
                incident.setStatus(com.model.IncidentStatus.RESOLVED);
                incident.setUpdatedAt(System.currentTimeMillis());
                incidentRepository.save(incident);
            }
        }
        return ResponseEntity.ok(ApiResponse.success(null, "Reports verified successfully.", 200));
    }
}
