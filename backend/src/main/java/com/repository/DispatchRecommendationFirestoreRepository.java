package com.repository;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.exception.FirebaseException;
import com.model.DispatchRecommendation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Encapsulates Firestore operations for DispatchRecommendation documents.
 */
@Slf4j
@Repository
public class DispatchRecommendationFirestoreRepository extends BaseFirestoreRepository<DispatchRecommendation> {

    public DispatchRecommendationFirestoreRepository(Firestore firestore) {
        super(firestore, "dispatch_recommendations");
    }

    public void save(DispatchRecommendation rec) {
        super.save(rec.getId(), rec);
    }

    public DispatchRecommendation findById(String id) {
        return super.findById(id, DispatchRecommendation.class);
    }

    public DispatchRecommendation findByIncidentId(String incidentId) {
        try {
            QuerySnapshot snapshot = firestore.collection(collectionName)
                    .whereEqualTo("incidentId", incidentId)
                    .get()
                    .get();

            List<QueryDocumentSnapshot> documents = snapshot.getDocuments();
            if (!documents.isEmpty()) {
                return documents.get(0).toObject(DispatchRecommendation.class);
            }
            return null;
        } catch (Exception e) {
            log.error("Firestore Error: Failed to query dispatch recommendation by incident ID: {}", incidentId, e);
            throw new FirebaseException("Failed to read dispatch recommendation", e);
        }
    }
}
