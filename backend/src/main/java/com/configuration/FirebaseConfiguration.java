package com.configuration;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import com.exception.FirebaseException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Enterprise bootstrap configuration for Google Firebase services.
 * Registers beans for FirebaseApp, Firestore database, and Google Cloud Storage bucket.
 */
@Slf4j
@Configuration
public class FirebaseConfiguration {

    @Value("${app.firebase.project-id:civic-lens-b4d47}")
    private String projectId;

    @Value("${app.firebase.storage-bucket}")
    private String storageBucket;

    /**
     * Helper to safely retrieve Google Application Default Credentials (ADC)
     * with a fallback to mock credentials for local development.
     */
    private GoogleCredentials getCredentials() {
        try {
            return GoogleCredentials.getApplicationDefault();
        } catch (Exception e) {
            log.warn("Application Default Credentials (ADC) were not found on this system. " +
                     "Falling back to dummy credentials for local/offline development. " +
                     "Error details: {}", e.getMessage());
            return new GoogleCredentials() {
                @Override
                public com.google.auth.oauth2.AccessToken refreshAccessToken() throws java.io.IOException {
                    return new com.google.auth.oauth2.AccessToken(
                            "mock-local-token", 
                            new java.util.Date(System.currentTimeMillis() + 3600_000)
                    );
                }
            };
        }
    }

    /**
     * Initializes and registers the FirebaseApp singleton.
     */
    @Bean
    public FirebaseApp firebaseApp() {
        try {
            log.info("Initializing Google Firebase App using Application Default Credentials (ADC)...");
            
            FirebaseOptions.Builder optionsBuilder = FirebaseOptions.builder()
                    .setCredentials(getCredentials());

            if (projectId != null && !projectId.trim().isEmpty()) {
                optionsBuilder.setProjectId(projectId.trim());
                log.info("Firebase Project ID configured: {}", projectId.trim());
            }

            if (storageBucket != null && !storageBucket.trim().isEmpty()) {
                optionsBuilder.setStorageBucket(storageBucket.trim());
                log.info("Firebase Storage bucket configured: {}", storageBucket.trim());
            } else {
                log.warn("Firebase Storage bucket is empty/unconfigured in properties.");
            }

            FirebaseOptions options = optionsBuilder.build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp app = FirebaseApp.initializeApp(options);
                log.info("Google Firebase initialized successfully with ADC: {}", app.getName());
                return app;
            } else {
                log.info("Google Firebase app already initialized.");
                return FirebaseApp.getInstance();
            }
        } catch (Exception e) {
            log.error("Failed to initialize Google Firebase Services using ADC", e);
            throw new FirebaseException("Failed to initialize Google Firebase Services using ADC", e);
        }
    }

    /**
     * Exposes Firestore database client as a bean.
     */
    @Bean
    public Firestore firestore(FirebaseApp firebaseApp) {
        log.info("Registering Google Firestore client bean.");
        return FirestoreClient.getFirestore(firebaseApp);
    }

    /**
     * Exposes default Google Cloud Storage client as a bean.
     */
    @Bean
    public Storage googleCloudStorage() {
        log.info("Registering Google Cloud Storage client bean using Application Default Credentials (ADC).");
        try {
            StorageOptions.Builder storageOptionsBuilder = StorageOptions.newBuilder()
                    .setCredentials(getCredentials());
            
            if (projectId != null && !projectId.trim().isEmpty()) {
                storageOptionsBuilder.setProjectId(projectId.trim());
            }

            Storage storage = storageOptionsBuilder.build().getService();
            if (storage == null) {
                log.error("Google Cloud Storage client initialized as null.");
                throw new FirebaseException("Google Cloud Storage client initialized as null.");
            }
            log.info("Google Cloud Storage client bean registered successfully using ADC.");
            return storage;
        } catch (Exception e) {
            log.error("Google Cloud Storage client could not be initialized. Stacktrace:", e);
            throw new FirebaseException("Google Cloud Storage client could not be initialized.", e);
        }
    }
}
