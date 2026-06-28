package com.repository;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.exception.FirebaseException;
import com.model.AuditLog;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

/**
 * Encapsulates Firestore operations for AuditLog documents.
 */
@Slf4j
@Repository
public class AuditLogFirestoreRepository extends BaseFirestoreRepository<AuditLog> {

    public AuditLogFirestoreRepository(Firestore firestore) {
        super(firestore, "audit_logs");
    }

    public void save(AuditLog logEntry) {
        super.save(logEntry.getId(), logEntry);
    }

    public AuditLog findById(String id) {
        return super.findById(id, AuditLog.class);
    }

    public List<AuditLog> findAll() {
        try {
            QuerySnapshot querySnapshot = firestore.collection("audit_logs").get().get();
            List<AuditLog> list = new ArrayList<>();
            for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
                list.add(document.toObject(AuditLog.class));
            }
            // Programmatic descending sort by timestamp
            list.sort((e1, e2) -> Long.compare(e2.getTimestamp(), e1.getTimestamp()));
            return list;
        } catch (Exception e) {
            log.error("Failed to query audit logs database", e);
            throw new FirebaseException("Failed to query audit logs database", e);
        }
    }

    public List<AuditLog> findByIncidentId(String incidentId) {
        try {
            QuerySnapshot querySnapshot = firestore.collection("audit_logs")
                    .whereEqualTo("incidentId", incidentId)
                    .get().get();
            List<AuditLog> list = new ArrayList<>();
            for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
                list.add(document.toObject(AuditLog.class));
            }
            list.sort((e1, e2) -> Long.compare(e2.getTimestamp(), e1.getTimestamp()));
            return list;
        } catch (Exception e) {
            log.error("Failed to query audit logs by incident", e);
            throw new FirebaseException("Failed to query audit logs by incident", e);
        }
    }
}
