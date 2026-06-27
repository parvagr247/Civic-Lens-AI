package com.dto;

import com.model.GeoLocation;
import com.model.Incident;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO returning the details of a registered incident.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentResponse {
    private String id;
    private String title;
    private String description;
    private String status;
    private String category;
    private String severity;
    private GeoLocation location;
    private String imageUrl;
    private Long createdAt;
    private Long updatedAt;

    /**
     * Map from Incident domain model to IncidentResponse DTO.
     */
    public static IncidentResponse fromEntity(Incident incident) {
        if (incident == null) {
            return null;
        }
        return IncidentResponse.builder()
                .id(incident.getId())
                .title(incident.getTitle())
                .description(incident.getDescription())
                .status(incident.getStatus() != null ? incident.getStatus().name() : null)
                .category(incident.getCategory() != null ? incident.getCategory().name() : null)
                .severity(incident.getSeverity() != null ? incident.getSeverity().name() : null)
                .location(incident.getLocation())
                .imageUrl(incident.getImageUrl())
                .createdAt(incident.getCreatedAt())
                .updatedAt(incident.getUpdatedAt())
                .build();
    }
}
