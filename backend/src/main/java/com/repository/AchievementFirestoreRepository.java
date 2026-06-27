package com.repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.exception.FirebaseException;
import com.model.Achievement;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

/**
 * Encapsulates Firestore operations for Achievement metadata definitions.
 */
@Slf4j
@Repository
public class AchievementFirestoreRepository {

    private final Firestore firestore;
    private static final String COLLECTION_NAME = "achievements";

    public AchievementFirestoreRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    /**
     * Saves or updates an Achievement configuration document.
     */
    public void save(Achievement achievement) {
        log.info("Firestore: Saving achievement configuration: {}", achievement.getId());
        try {
            ApiFuture<WriteResult> future = firestore.collection(COLLECTION_NAME)
                    .document(achievement.getId())
                    .set(achievement);
            future.get();
        } catch (Exception e) {
            log.error("Firestore Error: Failed to save achievement: {}", achievement.getId(), e);
            throw new FirebaseException("Failed to persist achievement configuration", e);
        }
    }

    /**
     * Retrieves an Achievement by ID.
     */
    public Achievement findById(String id) {
        try {
            DocumentSnapshot snapshot = firestore.collection(COLLECTION_NAME)
                    .document(id)
                    .get()
                    .get();

            if (snapshot.exists()) {
                return snapshot.toObject(Achievement.class);
            }
            return null;
        } catch (Exception e) {
            log.error("Firestore Error: Failed to fetch achievement: {}", id, e);
            throw new FirebaseException("Failed to read achievement detail", e);
        }
    }

    /**
     * Lists all available system achievements.
     */
    public List<Achievement> findAll() {
        try {
            QuerySnapshot snapshot = firestore.collection(COLLECTION_NAME)
                    .get()
                    .get();

            List<Achievement> achievements = new ArrayList<>();
            for (QueryDocumentSnapshot document : snapshot.getDocuments()) {
                achievements.add(document.toObject(Achievement.class));
            }
            return achievements;
        } catch (Exception e) {
            log.error("Firestore Error: Failed to retrieve achievements configurations", e);
            throw new FirebaseException("Failed to query achievements database", e);
        }
    }
}
