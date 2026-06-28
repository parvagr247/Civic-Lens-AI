package com.service;

import org.springframework.web.multipart.MultipartFile;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;

/**
 * Service interface defining cloud storage operations.
 */
public interface StorageService {

    /**
     * Uploads the multipart image file to the configured bucket.
     *
     * @param file       Multipart image file.
     * @param incidentId The generated incident identifier.
     * @return An ImageUploadResult containing both path and download URL.
     */
    ImageUploadResult uploadIncidentImage(MultipartFile file, String incidentId);

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    class ImageUploadResult {
        private String storagePath;
        private String downloadUrl;
    }
}
