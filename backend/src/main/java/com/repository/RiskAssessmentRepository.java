package com.repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.exception.FirebaseException;
import com.model.RiskAssessment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

/**
 * Repository handler for persisting and retrieving RiskAssessment documents in Firestore.
 */
@Slf4j
@Repository
public class RiskAssessmentRepository {

    private final Firestore firestore;
    private static final String COLLECTION_NAME = "risk_assessments";

    public RiskAssessmentRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    /**
     * Saves or updates a RiskAssessment record.
     */
    public void save(RiskAssessment assessment) {
        log.info("Saving risk assessment: {}", assessment.getId());
        try {
            ApiFuture<WriteResult> future = firestore.collection(COLLECTION_NAME)
                    .document(assessment.getId())
                    .set(assessment);
            // Block synchronously to ensure database consistency
            future.get();
            log.info("Risk assessment successfully saved in Firestore: {}", assessment.getId());
        } catch (Exception e) {
            log.error("Failed to save risk assessment {} in Firestore", assessment.getId(), e);
            throw new FirebaseException("Failed to save risk assessment to Firestore", e);
        }
    }

    /**
     * Retrieves a RiskAssessment record associated with a given Incident ID.
     */
    public RiskAssessment findByIncidentId(String incidentId) {
        log.info("Finding risk assessment by Incident ID: {}", incidentId);
        try {
            QuerySnapshot snapshot = firestore.collection(COLLECTION_NAME)
                    .whereEqualTo("incidentId", incidentId)
                    .get()
                    .get();

            List<QueryDocumentSnapshot> documents = snapshot.getDocuments();
            if (!documents.isEmpty()) {
                return documents.get(0).toObject(RiskAssessment.class);
            }
            log.warn("Risk assessment not found for Incident ID: {}", incidentId);
            return null;
        } catch (Exception e) {
            log.error("Failed to query risk assessment for incident {} from Firestore", incidentId, e);
            throw new FirebaseException("Failed to read risk assessment from Firestore", e);
        }
    }

    /**
     * Lists all risk assessments from Firestore.
     */
    public List<RiskAssessment> findAll() {
        log.info("Listing all risk assessments from Firestore");
        try {
            QuerySnapshot snapshot = firestore.collection(COLLECTION_NAME)
                    .get()
                    .get();

            List<RiskAssessment> assessments = new ArrayList<>();
            for (QueryDocumentSnapshot document : snapshot.getDocuments()) {
                assessments.add(document.toObject(RiskAssessment.class));
            }
            log.info("Retrieved {} risk assessments from Firestore", assessments.size());
            return assessments;
        } catch (Exception e) {
            log.error("Failed to query all risk assessments from Firestore", e);
            throw new FirebaseException("Failed to list risk assessments from Firestore", e);
        }
    }

    /**
     * Finds risk assessments with an overall risk score greater than or equal to the threshold.
     */
    public List<RiskAssessment> findHighRisk(int threshold) {
        log.info("Listing risk assessments with overall score >= {}", threshold);
        try {
            QuerySnapshot snapshot = firestore.collection(COLLECTION_NAME)
                    .whereGreaterThanOrEqualTo("overallRiskScore", threshold)
                    .get()
                    .get();

            List<RiskAssessment> assessments = new ArrayList<>();
            for (QueryDocumentSnapshot document : snapshot.getDocuments()) {
                assessments.add(document.toObject(RiskAssessment.class));
            }
            log.info("Retrieved {} high risk assessments from Firestore", assessments.size());
            return assessments;
        } catch (Exception e) {
            log.error("Failed to query high risk assessments from Firestore", e);
            throw new FirebaseException("Failed to query high risk assessments from Firestore", e);
        }
    }
}
