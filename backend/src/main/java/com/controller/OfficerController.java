package com.controller;

import com.dto.ApiResponse;
import com.model.Assignment;
import com.model.Message;
import com.model.Officer;
import com.service.OfficerService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller exposing endpoints for officer management, assignments, and messaging.
 */
@Slf4j
@RestController
@RequestMapping("/api")
@lombok.RequiredArgsConstructor
public class OfficerController {

    private final OfficerService officerService;

    @PostMapping("/officers")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Officer>> createOfficer(
            @RequestBody Map<String, String> request) {
        String name = request.get("name");
        String email = request.get("email");
        String password = request.get("password");
        String department = request.get("department");

        log.info("REST: Request to create field officer: {}", email);
        Officer officer = officerService.createOfficer(name, email, password, department);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                officer,
                "Officer account created successfully.",
                HttpStatus.CREATED.value()
        ));
    }

    @GetMapping("/officers")
    public ResponseEntity<ApiResponse<List<Officer>>> getAllOfficers() {
        log.info("REST: Retrieving all field officers list");
        List<Officer> list = officerService.getAllOfficers();

        return ResponseEntity.ok(ApiResponse.success(
                list,
                "Officers list retrieved successfully.",
                HttpStatus.OK.value()
        ));
    }

    @PostMapping("/assignments")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> assignIncident(
            @RequestBody Map<String, Object> request) {
        String incidentId = (String) request.get("incidentId");
        String officerId = (String) request.get("officerId");
        Long deadline = ((Number) request.get("deadline")).longValue();
        String priority = (String) request.get("priority");
        String instructions = (String) request.get("instructions");

        log.info("REST: Dispatcher scheduling incident {} to officer {}", incidentId, officerId);
        officerService.assignIncident(incidentId, officerId, deadline, priority, instructions);

        return ResponseEntity.ok(ApiResponse.success(
                "Incident task assigned successfully.",
                HttpStatus.OK.value()
        ));
    }

    @GetMapping("/assignments/officer")
    public ResponseEntity<ApiResponse<List<Assignment>>> getAssignmentsForOfficer(Authentication authentication) {
        String email = authentication.getName();
        log.info("REST: Retrieving tasks assigned to officer {}", email);
        List<Assignment> list = officerService.getAssignmentsForOfficer(email);

        return ResponseEntity.ok(ApiResponse.success(
                list,
                "Officer assignments retrieved successfully.",
                HttpStatus.OK.value()
        ));
    }

    @GetMapping("/assignments/incident/{incidentId}")
    public ResponseEntity<ApiResponse<Assignment>> getAssignmentForIncident(@PathVariable String incidentId) {
        log.info("REST: Fetching task details for incident {}", incidentId);
        Assignment assignment = officerService.getAssignmentForIncident(incidentId);

        return ResponseEntity.ok(ApiResponse.success(
                assignment,
                "Incident assignment retrieved.",
                HttpStatus.OK.value()
        ));
    }

    @PatchMapping("/assignments/{assignmentId}/status")
    public ResponseEntity<ApiResponse<Void>> updateAssignmentStatus(
            @PathVariable String assignmentId,
            @RequestBody Map<String, String> request) {
        String status = request.get("status");
        String internalNotes = request.get("internalNotes");
        String completionImageUrl = request.get("completionImageUrl");
        String completionReport = request.get("completionReport");

        log.info("REST: Updating status of task {} to {}", assignmentId, status);
        officerService.updateAssignmentStatus(assignmentId, status, internalNotes, completionImageUrl, completionReport);

        return ResponseEntity.ok(ApiResponse.success(
                "Task status updated successfully.",
                HttpStatus.OK.value()
        ));
    }

    @PostMapping("/chat/{roomId}")
    public ResponseEntity<ApiResponse<Void>> sendInternalMessage(
            @PathVariable String roomId,
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        String text = request.get("text");
        String senderEmail = authentication.getName();

        log.info("REST: Dispatcher/Officer chat message from {}", senderEmail);
        officerService.sendInternalMessage(roomId, text, senderEmail);

        return ResponseEntity.ok(ApiResponse.success(
                "Message sent.",
                HttpStatus.OK.value()
        ));
    }

    @GetMapping("/chat/{roomId}")
    public ResponseEntity<ApiResponse<List<Message>>> getChatMessages(@PathVariable String roomId) {
        log.info("REST: Fetching chat history for room: {}", roomId);
        List<Message> list = officerService.getChatMessages(roomId);

        return ResponseEntity.ok(ApiResponse.success(
                list,
                "Chat messages history retrieved successfully.",
                HttpStatus.OK.value()
        ));
    }
}
