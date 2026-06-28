package com.repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.exception.FirebaseException;
import com.model.ActivityLog;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

/**
 * Encapsulates Firestore operations for ActivityLog documents.
 */
@Slf4j
@Repository
public class ActivityLogFirestoreRepository {

    private final Firestore firestore;
    private static final String COLLECTION_NAME = "activity_logs";

    public ActivityLogFirestoreRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    /**
     * Saves a new ActivityLog entry.
     */
    public void save(ActivityLog activityLog) {
        log.info("Firestore: Logging action '{}' for user: {}", activityLog.getAction(), activityLog.getUserId());
        try {
            ApiFuture<WriteResult> future = firestore.collection(COLLECTION_NAME)
                    .document(activityLog.getId())
                    .set(activityLog);
            future.get();
        } catch (Exception e) {
            log.error("Firestore Error: Failed to save activity log", e);
            throw new FirebaseException("Failed to persist activity audit log", e);
        }
    }

    /**
     * Retrieves all activity logs associated with a user, sorted by timestamp descending.
     */
    public List<ActivityLog> findByUserId(String userId) {
        log.info("Firestore: Querying activity logs for User ID: {}", userId);
        try {
            QuerySnapshot snapshot = firestore.collection(COLLECTION_NAME)
                    .whereEqualTo("userId", userId)
                    .get()
                    .get();

            List<ActivityLog> logs = new ArrayList<>();
            for (QueryDocumentSnapshot document : snapshot.getDocuments()) {
                logs.add(document.toObject(ActivityLog.class));
            }
            // Sort programmatically descending by timestamp
            logs.sort((l1, l2) -> Long.compare(l2.getTimestamp(), l1.getTimestamp()));
            return logs;
        } catch (Exception e) {
            log.error("Firestore Error: Failed to fetch activity logs for user: {}", userId, e);
            throw new FirebaseException("Failed to query activity audit trail", e);
        }
    }
}
