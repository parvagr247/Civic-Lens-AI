package com.repository;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.exception.FirebaseException;
import com.model.AnonymousTracking;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

/**
 * Encapsulates Firestore operations for AnonymousTracking documents.
 */
@Slf4j
@Repository
public class AnonymousTrackingFirestoreRepository extends BaseFirestoreRepository<AnonymousTracking> {

    public AnonymousTrackingFirestoreRepository(Firestore firestore) {
        super(firestore, "anonymous_trackings");
    }

    public void save(AnonymousTracking tracking) {
        super.save(tracking.getId(), tracking);
    }

    public AnonymousTracking findById(String id) {
        return super.findById(id, AnonymousTracking.class);
    }

    public AnonymousTracking findByTrackingId(String trackingId) {
        try {
            QuerySnapshot querySnapshot = firestore.collection("anonymous_trackings")
                    .whereEqualTo("trackingId", trackingId)
                    .get().get();
            if (querySnapshot.isEmpty()) return null;
            return querySnapshot.getDocuments().get(0).toObject(AnonymousTracking.class);
        } catch (Exception e) {
            log.error("Failed to query anonymous tracking by trackingId", e);
            throw new FirebaseException("Failed to query anonymous tracking", e);
        }
    }

    public AnonymousTracking findByEmailOrPhone(String emailOrPhone) {
        try {
            QuerySnapshot querySnapshot = firestore.collection("anonymous_trackings")
                    .whereEqualTo("emailOrPhone", emailOrPhone)
                    .get().get();
            if (querySnapshot.isEmpty()) return null;
            return querySnapshot.getDocuments().get(0).toObject(AnonymousTracking.class);
        } catch (Exception e) {
            log.error("Failed to query anonymous tracking by email/phone", e);
            throw new FirebaseException("Failed to query anonymous tracking", e);
        }
    }
}
