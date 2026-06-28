package com.repository;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.exception.FirebaseException;
import com.model.EscalationLog;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

/**
 * Encapsulates Firestore operations for EscalationLog documents.
 */
@Slf4j
@Repository
public class EscalationLogFirestoreRepository extends BaseFirestoreRepository<EscalationLog> {

    public EscalationLogFirestoreRepository(Firestore firestore) {
        super(firestore, "escalation_logs");
    }

    public void save(EscalationLog logEntry) {
        super.save(logEntry.getId(), logEntry);
    }

    public EscalationLog findById(String id) {
        return super.findById(id, EscalationLog.class);
    }

    public List<EscalationLog> findByIncidentId(String incidentId) {
        try {
            QuerySnapshot snapshot = firestore.collection(collectionName)
                    .whereEqualTo("incidentId", incidentId)
                    .get()
                    .get();

            List<EscalationLog> list = new ArrayList<>();
            for (QueryDocumentSnapshot doc : snapshot.getDocuments()) {
                list.add(doc.toObject(EscalationLog.class));
            }
            // Sort in memory to avoid composite index requirements
            list.sort((e1, e2) -> Long.compare(e2.getEscalatedAt(), e1.getEscalatedAt()));
            return list;
        } catch (Exception e) {
            log.error("Firestore Error: Failed to query escalation logs by incident ID: {}", incidentId, e);
            throw new FirebaseException("Failed to read escalation logs", e);
        }
    }
}
