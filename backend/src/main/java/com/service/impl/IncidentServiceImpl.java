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
        log.info("Incident Service: Retrieving all incidents sorted by supportCount and creation date");
        return incidentRepository.findAll().stream()
                .sorted((i1, i2) -> {
                    int c1 = i1.getSupportCount() != null ? i1.getSupportCount() : 0;
                    int c2 = i2.getSupportCount() != null ? i2.getSupportCount() : 0;
                    if (c1 != c2) {
                        return Integer.compare(c2, c1); // supportCount descending
                    }
                    long t1 = i1.getCreatedAt() != null ? i1.getCreatedAt() : 0L;
                    long t2 = i2.getCreatedAt() != null ? i2.getCreatedAt() : 0L;
                    return Long.compare(t2, t1); // createdAt descending
                })
                .map(this::mapToIncidentResponse)
                .collect(Collectors.toList());
    }

    @Override
    public IncidentResponse toggleSupport(String incidentId, String userEmail) {
        log.info("Incident Service: Toggling support for incident {} by user {}", incidentId, userEmail);

        if (userEmail == null || userEmail.trim().isEmpty() || "anonymousUser".equalsIgnoreCase(userEmail)) {
            throw new ValidationException("Authentication required to support incidents.");
        }

        Incident incident = incidentRepository.findById(incidentId);
        if (incident == null) {
            throw new ResourceNotFoundException("Incident not found with ID: " + incidentId);
        }

        List<String> supporters = incident.getSupportedBy();
        if (supporters == null) {
            supporters = new java.util.ArrayList<>();
        }

        if (supporters.contains(userEmail)) {
            supporters.remove(userEmail);
            log.info("User {} removed support from incident {}", userEmail, incidentId);
        } else {
            supporters.add(userEmail);
            log.info("User {} added support for incident {}", userEmail, incidentId);
            
            try {
                User user = userRepository.findByEmail(userEmail);
                if (user != null) {
                    gamificationService.rewardPoints(user.getId(), "COMMUNITY_SUPPORT", incidentId);
                }
            } catch (Exception e) {
                log.warn("Gamification warning: Failed to reward points to {} for support", userEmail, e);
            }
        }

        incident.setSupportedBy(supporters);
        incident.setSupportCount(supporters.size());
        incident.setUpdatedAt(System.currentTimeMillis());
        incidentRepository.save(incident);

        return mapToIncidentResponse(incident);
    }

    private IncidentResponse mapToIncidentResponse(Incident incident) {
        return IncidentResponse.fromEntity(incident);
    }
}
