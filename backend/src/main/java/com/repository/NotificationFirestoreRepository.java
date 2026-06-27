package com.repository;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.exception.FirebaseException;
import com.model.Notification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

/**
 * Encapsulates Firestore operations for Notification documents.
 * Extends the abstract generic BaseFirestoreRepository to inherit standard CRUD routines.
 */
@Slf4j
@Repository
public class NotificationFirestoreRepository extends BaseFirestoreRepository<Notification> {

    public NotificationFirestoreRepository(Firestore firestore) {
        super(firestore, "notifications");
    }

    public void save(Notification notification) {
        super.save(notification.getId(), notification);
    }

    public Notification findById(String id) {
        return super.findById(id, Notification.class);
    }

    /**
     * Retrieves all notifications for a recipient, sorted by creation date descending.
     */
    public List<Notification> findByRecipientId(String recipientId) {
        try {
            QuerySnapshot snapshot = firestore.collection(collectionName)
                    .whereEqualTo("recipientId", recipientId)
                    .get()
                    .get();

            List<Notification> list = new ArrayList<>();
            for (QueryDocumentSnapshot document : snapshot.getDocuments()) {
                list.add(document.toObject(Notification.class));
            }
            // Sort in memory to avoid composite index requirements
            list.sort((n1, n2) -> Long.compare(n2.getCreatedAt(), n1.getCreatedAt()));
            return list;
        } catch (Exception e) {
            log.error("Firestore Error: Failed to query notifications for recipient: {}", recipientId, e);
            throw new FirebaseException("Failed to query notifications database", e);
        }
    }
}
