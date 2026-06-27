package com.service.impl;

import com.dto.IncidentResponse;
import com.exception.ResourceNotFoundException;
import com.exception.ValidationException;
import com.model.*;
import com.repository.ActivityLogFirestoreRepository;
import com.repository.IncidentRepository;
import com.repository.UserFirestoreRepository;
import com.service.GamificationService;
import com.service.IncidentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service implementation managing operational incident details and status transitions.
 */
@Slf4j
@Service
public class IncidentServiceImpl implements IncidentService {

    private final IncidentRepository incidentRepository;
    private final UserFirestoreRepository userRepository;
    private final GamificationService gamificationService;
    private final ActivityLogFirestoreRepository activityLogRepository;

    public IncidentServiceImpl(
            IncidentRepository incidentRepository,
            UserFirestoreRepository userRepository,
            GamificationService gamificationService,
            ActivityLogFirestoreRepository activityLogRepository) {
        this.incidentRepository = incidentRepository;
        this.userRepository = userRepository;
        this.gamificationService = gamificationService;
        this.activityLogRepository = activityLogRepository;
    }

    @Override
    public IncidentResponse updateIncidentStatus(String incidentId, String status) {
        log.info("Incident Service: Updating status for incident {} to {}", incidentId, status);

        // 1. Retrieve incident
        Incident incident = incidentRepository.findById(incidentId);
        if (incident == null) {
            throw new ResourceNotFoundException("Incident not found with ID: " + incidentId);
        }

        // 2. Validate status mapping
        IncidentStatus oldStatus = incident.getStatus();
        IncidentStatus newStatus;
        try {
            newStatus = IncidentStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid incident status value: " + status);
        }

        if (oldStatus == newStatus) {
            return mapToIncidentResponse(incident);
        }

        // 3. Update status
        incident.setStatus(newStatus);
        incident.setUpdatedAt(System.currentTimeMillis());
        incidentRepository.save(incident);

        // 4. If transitioned to RESOLVED, award citizen points (+50)
        if (newStatus == IncidentStatus.RESOLVED && oldStatus != IncidentStatus.RESOLVED) {
            log.info("Incident Service: Incident {} resolved. Checking reporter for point allocation.", incidentId);
            try {
                String reporterEmail = incident.getReportedBy();
                if (reporterEmail != null && !reporterEmail.isEmpty()) {
                    User user = userRepository.findByEmail(reporterEmail);
                    if (user != null) {
                        // Reward points for issue resolution
                        gamificationService.rewardPoints(user.getId(), "ISSUE_RESOLVED", incidentId);
                        log.info("Incident Service: Successfully allocated points to user: {}", user.getEmail());
                    }
                }
            } catch (Exception e) {
                log.error("Incident Service Warning: Failed to allocate citizen points for resolution of {}", incidentId, e);
            }
        }

        // 5. Save audit activity log
        ActivityLog logEntry = ActivityLog.builder()
                .id(UUID.randomUUID().toString())
                .userId("SYSTEM")
                .action("STATUS_TRANSITION")
                .description("Incident '" + incident.getTitle() + "' status updated from " + oldStatus + " to " + newStatus)
                .timestamp(System.currentTimeMillis())
                .build();
        activityLogRepository.save(logEntry);

        return mapToIncidentResponse(incident);
    }

    @Override
    public List<IncidentResponse> getAllIncidents() {
        log.info("Incident Service: Retrieving all incidents");
        return incidentRepository.findAll().stream()
                .sorted(Comparator.comparing(Incident::getCreatedAt).reversed())
                .map(this::mapToIncidentResponse)
                .collect(Collectors.toList());
    }

    private IncidentResponse mapToIncidentResponse(Incident incident) {
        return IncidentResponse.fromEntity(incident);
    }
}
