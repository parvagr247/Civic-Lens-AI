package com.service.impl;

import com.google.cloud.storage.Blob;
import com.google.cloud.storage.Storage;
import com.exception.ValidationException;
import com.service.StorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Service implementation managing image uploads to Google Firebase Cloud Storage.
 */
@Slf4j
@Service
public class FirebaseStorageServiceImpl implements StorageService {

    private final Storage storage;
    private final String bucketName;
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "webp");
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

    @Autowired
    public FirebaseStorageServiceImpl(
            Storage storage,
            @org.springframework.beans.factory.annotation.Value("${app.firebase.storage-bucket}") String bucketName) {
        this.storage = storage;
        this.bucketName = bucketName;
    }

    @Override
    public ImageUploadResult uploadIncidentImage(MultipartFile file, String incidentId) {
        log.info("Initiating upload logic for incident: {}", incidentId);

        if (file == null || file.isEmpty()) {
            throw new ValidationException("Image file must be provided.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ValidationException("File size exceeds the maximum limit of 10MB.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new ValidationException("File must have a valid name.");
        }

        String extension = getFileExtension(originalFilename);
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new ValidationException("Only JPG, JPEG, PNG, and WEBP formats are allowed.");
        }

        // Throw exception if the storage client is null or bucket name is empty
        if (storage == null || bucketName == null || bucketName.trim().isEmpty()) {
            log.error("Firebase Storage is unconfigured or null. Upload aborted for incident: {}", incidentId);
            throw new com.exception.FirebaseException("Firebase Storage is null or unconfigured. Cannot upload image.");
        }

        LocalDate now = LocalDate.now();
        int year = now.getYear();
        int month = now.getMonthValue();
        String uniqueFilename = UUID.randomUUID() + "." + extension;
        String blobPath = String.format("uploads/%d/%02d/%s/%s", year, month, incidentId, uniqueFilename);

        log.info("Upload started: filename='{}', contentType='{}', bucket='{}', destinationPath='{}'", 
                 originalFilename, file.getContentType(), bucketName, blobPath);

        try {
            byte[] bytes = file.getBytes();
            
            // Generate a secure, unique download token
            String downloadToken = UUID.randomUUID().toString();
            
            // Upload to Google Cloud Storage setting the firebase token metadata
            com.google.cloud.storage.BlobId blobId = com.google.cloud.storage.BlobId.of(bucketName, blobPath);
            com.google.cloud.storage.BlobInfo blobInfo = com.google.cloud.storage.BlobInfo.newBuilder(blobId)
                    .setContentType(file.getContentType())
                    .setMetadata(java.util.Collections.singletonMap("firebaseStorageDownloadTokens", downloadToken))
                    .build();
            
            log.info("Uploading bytes to Google Cloud Storage bucket...");
            storage.create(blobInfo, bytes);
            log.info("Upload completed: blob path='{}'", blobPath);
            
            // Construct Alt Media download link with download token (Standard Firebase format)
            String publicUrl = String.format("https://firebasestorage.googleapis.com/v0/b/%s/o/%s?alt=media&token=%s",
                    bucketName,
                    URLEncoder.encode(blobPath, StandardCharsets.UTF_8.name()),
                    downloadToken);
            
            log.info("Generated download URL: '{}'", publicUrl);
            return ImageUploadResult.builder()
                    .storagePath(blobPath)
                    .downloadUrl(publicUrl)
                    .build();
        } catch (IOException e) {
            log.error("Failed to read image bytes during upload. Filename: {}, Bucket: {}", originalFilename, bucketName, e);
            throw new ValidationException("Unable to process uploaded file bytes: " + e.getMessage());
        } catch (Exception e) {
            log.error("Failed to upload image file to Google Firebase Storage. Filename: {}, Bucket: {}, BlobPath: {}. Stacktrace:", 
                      originalFilename, bucketName, blobPath, e);
            throw new com.exception.FirebaseException("Failed to upload image to Firebase Storage: " + e.getMessage(), e);
        }
    }

    private String getFileExtension(String filename) {
        int lastIndex = filename.lastIndexOf('.');
        if (lastIndex == -1) {
            return "";
        }
        return filename.substring(lastIndex + 1);
    }
}
