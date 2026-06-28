package com.repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.exception.FirebaseException;
import com.model.Incident;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

/**
 * Repository handler for persisting and retrieving Incident documents in Firestore.
 */
@Slf4j
@Repository
public class IncidentRepository {

    private final Firestore firestore;
    private static final String COLLECTION_NAME = "incidents";

    public IncidentRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    /**
     * Saves or updates an Incident record.
     */
    public void save(Incident incident) {
        log.info("Saving incident: {}", incident.getId());
        try {
            ApiFuture<WriteResult> future = firestore.collection(COLLECTION_NAME)
                    .document(incident.getId())
                    .set(incident);
            // Block synchronously to ensure database consistency
            future.get();
            log.info("Incident successfully saved in Firestore: {}", incident.getId());
        } catch (Exception e) {
            log.error("Failed to save incident {} in Firestore", incident.getId(), e);
            throw new FirebaseException("Failed to save incident to Firestore", e);
        }
    }

    /**
     * Retrieves an Incident record by unique ID.
     */
    public Incident findById(String id) {
        log.info("Finding incident by ID: {}", id);
        try {
            DocumentSnapshot snapshot = firestore.collection(COLLECTION_NAME)
                    .document(id)
                    .get()
                    .get();

            if (snapshot.exists()) {
                return snapshot.toObject(Incident.class);
            }
            log.warn("Incident not found with ID: {}", id);
            return null;
        } catch (Exception e) {
            log.error("Failed to query incident {} from Firestore", id, e);
            throw new FirebaseException("Failed to read incident from Firestore", e);
        }
    }

    /**
     * Lists all incidents ordered by creation date descending.
     */
    public List<Incident> findAll() {
        log.info("Listing all incidents ordered by creation date (descending)");
        try {
            QuerySnapshot snapshot = firestore.collection(COLLECTION_NAME)
                    .orderBy("createdAt", Query.Direction.DESCENDING)
                    .get()
                    .get();

            List<Incident> incidents = new ArrayList<>();
            for (QueryDocumentSnapshot document : snapshot.getDocuments()) {
                incidents.add(document.toObject(Incident.class));
            }
            log.info("Retrieved {} incidents from Firestore", incidents.size());
            return incidents;
        } catch (Exception e) {
            log.error("Failed to query all incidents from Firestore", e);
            throw new FirebaseException("Failed to list incidents from Firestore", e);
        }
    }

    /**
     * Lists incidents submitted by a specific user (queried by their email).
     */
    public List<Incident> findByReportedBy(String reportedBy) {
        log.info("Listing incidents reported by email: {}", reportedBy);
        try {
            QuerySnapshot snapshot = firestore.collection(COLLECTION_NAME)
                    .whereEqualTo("reportedBy", reportedBy)
                    .get()
                    .get();

            List<Incident> incidents = new ArrayList<>();
            for (QueryDocumentSnapshot document : snapshot.getDocuments()) {
                incidents.add(document.toObject(Incident.class));
            }
            incidents.sort((i1, i2) -> Long.compare(i2.getCreatedAt(), i1.getCreatedAt()));
            return incidents;
        } catch (Exception e) {
            log.error("Failed to query incidents reported by {} from Firestore", reportedBy, e);
            throw new FirebaseException("Failed to read user reported incidents from database", e);
        }
    }
}
