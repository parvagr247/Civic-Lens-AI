package com.repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.exception.FirebaseException;
import com.model.CitizenProfile;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

/**
 * Encapsulates Firestore operations for CitizenProfile documents.
 */
@Slf4j
@Repository
public class CitizenProfileFirestoreRepository {

    private final Firestore firestore;
    private static final String COLLECTION_NAME = "citizen_profiles";

    public CitizenProfileFirestoreRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    /**
     * Persists or updates a CitizenProfile.
     */
    public void save(CitizenProfile profile) {
        log.info("Firestore: Saving citizen profile for user: {}", profile.getUserId());
        try {
            ApiFuture<WriteResult> future = firestore.collection(COLLECTION_NAME)
                    .document(profile.getUserId())
                    .set(profile);
            future.get();
            log.info("Firestore: Citizen profile saved successfully for: {}", profile.getUserId());
        } catch (Exception e) {
            log.error("Firestore Error: Failed to save profile for user: {}", profile.getUserId(), e);
            throw new FirebaseException("Failed to persist citizen profile", e);
        }
    }

    /**
     * Retrieves a CitizenProfile matching the unique userId.
     */
    public CitizenProfile findByUserId(String userId) {
        log.info("Firestore: Querying profile for User ID: {}", userId);
        try {
            DocumentSnapshot snapshot = firestore.collection(COLLECTION_NAME)
                    .document(userId)
                    .get()
                    .get();

            if (snapshot.exists()) {
                return snapshot.toObject(CitizenProfile.class);
            }
            return null;
        } catch (Exception e) {
            log.error("Firestore Error: Failed to read profile for user: {}", userId, e);
            throw new FirebaseException("Failed to fetch citizen profile", e);
        }
    }

    /**
     * Queries all citizen profiles sorted by points descending.
     */
    public List<CitizenProfile> findAllSortedByPoints() {
        log.info("Firestore: Listing all profiles sorted by points descending");
        try {
            QuerySnapshot snapshot = firestore.collection(COLLECTION_NAME)
                    .orderBy("points", Query.Direction.DESCENDING)
                    .get()
                    .get();

            List<CitizenProfile> profiles = new ArrayList<>();
            for (QueryDocumentSnapshot document : snapshot.getDocuments()) {
                profiles.add(document.toObject(CitizenProfile.class));
            }
            return profiles;
        } catch (Exception e) {
            log.error("Firestore Error: Failed to list sorted profiles", e);
            throw new FirebaseException("Failed to read ranked profiles from database", e);
        }
    }

    /**
     * Helper to list all profiles.
     */
    public List<CitizenProfile> findAll() {
        log.info("Firestore: Listing all citizen profiles");
        try {
            QuerySnapshot snapshot = firestore.collection(COLLECTION_NAME)
                    .get()
                    .get();

            List<CitizenProfile> profiles = new ArrayList<>();
            for (QueryDocumentSnapshot document : snapshot.getDocuments()) {
                profiles.add(document.toObject(CitizenProfile.class));
            }
            return profiles;
        } catch (Exception e) {
            log.error("Firestore Error: Failed to query all citizen profiles", e);
            throw new FirebaseException("Failed to list citizen profiles", e);
        }
    }
}
