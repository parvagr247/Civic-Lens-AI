package com.service;

import com.dto.IncidentResponse;
import java.util.List;

/**
 * Service interface specifying incident status updates and search operations.
 */
public interface IncidentService {

    /**
     * Updates an incident status and reallocates citizen points if resolved.
     *
     * @param incidentId Unique incident UUID.
     * @param status String value of new IncidentStatus.
     * @return Updated IncidentResponse payload.
     */
    IncidentResponse updateIncidentStatus(String incidentId, String status);

    /**
     * Retrieves all incidents reported in the system.
     *
     * @return List of IncidentResponses.
     */
    List<IncidentResponse> getAllIncidents();

    /**
     * Toggles support (upvote) for an incident by a user email.
     *
     * @param incidentId Unique incident UUID.
     * @param userEmail Email of the user toggling support.
     * @return Updated IncidentResponse payload.
     */
    IncidentResponse toggleSupport(String incidentId, String userEmail);
}
