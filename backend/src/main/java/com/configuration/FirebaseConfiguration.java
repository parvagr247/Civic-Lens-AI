package com.configuration;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.storage.Bucket;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import com.google.firebase.cloud.StorageClient;
import com.exception.FirebaseException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;

import java.io.InputStream;

/**
 * Enterprise bootstrap configuration for Google Firebase services.
 * Registers beans for FirebaseApp, Firestore database, and Google Cloud Storage bucket.
 */
@Slf4j
@Configuration
public class FirebaseConfiguration {

    private final ResourceLoader resourceLoader;
    
    @Value("${app.firebase.config-path}")
    private String firebaseConfigPath;

    @Value("${app.firebase.storage-bucket}")
    private String storageBucket;

    public FirebaseConfiguration(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    /**
     * Initializes and registers the FirebaseApp singleton.
     */
    @Bean
    public FirebaseApp firebaseApp() {
        try {
            String resolvedPath = firebaseConfigPath;
            if (resolvedPath == null || resolvedPath.trim().isEmpty()) {
                resolvedPath = "classpath:firebase-service-account.json";
            }
            log.info("Initializing Google Firebase App using config path: {}", resolvedPath);
            Resource resource = resourceLoader.getResource(resolvedPath);
            
            if (!resource.exists()) {
                throw new FirebaseException("Firebase service account credentials file not found at " + resolvedPath);
            }

            try (InputStream serviceAccount = resource.getInputStream()) {
                FirebaseOptions.Builder optionsBuilder = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount));

                if (storageBucket != null && !storageBucket.trim().isEmpty()) {
                    optionsBuilder.setStorageBucket(storageBucket.trim());
                    log.info("Firebase Storage configured.");
                } else {
                    log.info("Firebase Storage disabled.\nStorage-dependent features unavailable.");
                }

                FirebaseOptions options = optionsBuilder.build();

                if (FirebaseApp.getApps().isEmpty()) {
                    FirebaseApp app = FirebaseApp.initializeApp(options);
                    log.info("Google Firebase initialized successfully: {}", app.getName());
                    return app;
                } else {
                    log.info("Google Firebase app already initialized.");
                    return FirebaseApp.getInstance();
                }
            }
        } catch (Exception e) {
            log.error("Failed to initialize Google Firebase Services", e);
            throw new FirebaseException("Failed to initialize Google Firebase Services", e);
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
     * Exposes default Firebase Cloud Storage Bucket client as a bean.
     */
    @Bean
    public Bucket storageBucket(FirebaseApp firebaseApp) {
        if (storageBucket == null || storageBucket.trim().isEmpty()) {
            log.info("Google Firebase Storage bucket is not configured. Returning null Bucket bean.");
            return null;
        }
        log.info("Registering Google Firebase Storage bucket bean: {}", storageBucket);
        try {
            return StorageClient.getInstance(firebaseApp).bucket();
        } catch (Exception e) {
            log.warn("Google Firebase Storage bucket '{}' could not be initialized: {}. Cloud storage operations will be disabled.", storageBucket, e.getMessage());
            return null;
        }
    }
}
