package com.repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.exception.FirebaseException;
import com.model.IncidentAnalysis;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository handler for persisting and retrieving IncidentAnalysis documents in Firestore.
 */
@Slf4j
@Repository
public class IncidentAnalysisRepository {

    private final Firestore firestore;
    private static final String COLLECTION_NAME = "incident_analysis";

    public IncidentAnalysisRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    /**
     * Saves or updates an IncidentAnalysis record.
     */
    public void save(IncidentAnalysis analysis) {
        log.info("Saving incident analysis: {}", analysis.getId());
        try {
            ApiFuture<WriteResult> future = firestore.collection(COLLECTION_NAME)
                    .document(analysis.getId())
                    .set(analysis);
            // Block synchronously to ensure database consistency
            future.get();
            log.info("Incident analysis successfully saved in Firestore: {}", analysis.getId());
        } catch (Exception e) {
            log.error("Failed to save analysis {} in Firestore", analysis.getId(), e);
            throw new FirebaseException("Failed to save incident analysis to Firestore", e);
        }
    }

    /**
     * Retrieves an IncidentAnalysis record associated with a given Incident ID.
     */
    public IncidentAnalysis findByIncidentId(String incidentId) {
        log.info("Finding incident analysis by Incident ID: {}", incidentId);
        try {
            QuerySnapshot snapshot = firestore.collection(COLLECTION_NAME)
                    .whereEqualTo("incidentId", incidentId)
                    .get()
                    .get();

            List<QueryDocumentSnapshot> documents = snapshot.getDocuments();
            if (!documents.isEmpty()) {
                return documents.get(0).toObject(IncidentAnalysis.class);
            }
            log.warn("Incident analysis not found for Incident ID: {}", incidentId);
            return null;
        } catch (Exception e) {
            log.error("Failed to query analysis for incident {} from Firestore", incidentId, e);
            throw new FirebaseException("Failed to read incident analysis from Firestore", e);
        }
    }
}
