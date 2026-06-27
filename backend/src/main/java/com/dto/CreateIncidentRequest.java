package com.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

/**
 * DTO capturing multipart form-data requests to register a new incident.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateIncidentRequest {

    @NotBlank(message = "Title cannot be blank.")
    @Size(max = 100, message = "Title must not exceed 100 characters.")
    private String title;

    @NotBlank(message = "Description cannot be blank.")
    @Size(max = 1000, message = "Description must not exceed 1000 characters.")
    private String description;

    @NotNull(message = "Latitude is required.")
    private Double latitude;

    @NotNull(message = "Longitude is required.")
    private Double longitude;

    @NotBlank(message = "Address is required.")
    private String address;

    @NotNull(message = "Incident image is required.")
    private MultipartFile image;

    private Boolean anonymous = false;
}
