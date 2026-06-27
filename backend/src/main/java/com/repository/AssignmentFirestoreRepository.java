package com.repository;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.exception.FirebaseException;
import com.model.Assignment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

/**
 * Encapsulates Firestore operations for Assignment documents.
 * Extends the abstract generic BaseFirestoreRepository to inherit standard CRUD routines.
 */
@Slf4j
@Repository
public class AssignmentFirestoreRepository extends BaseFirestoreRepository<Assignment> {

    public AssignmentFirestoreRepository(Firestore firestore) {
        super(firestore, "assignments");
    }

    public void save(Assignment assignment) {
        super.save(assignment.getId(), assignment);
    }

    public Assignment findById(String id) {
        return super.findById(id, Assignment.class);
    }

    public List<Assignment> findAll() {
        return super.findAll(Assignment.class);
    }

    public Assignment findByIncidentId(String incidentId) {
        try {
            QuerySnapshot snapshot = firestore.collection(collectionName)
                    .whereEqualTo("incidentId", incidentId)
                    .get()
                    .get();

            List<QueryDocumentSnapshot> documents = snapshot.getDocuments();
            if (!documents.isEmpty()) {
                return documents.get(0).toObject(Assignment.class);
            }
            return null;
        } catch (Exception e) {
            log.error("Firestore Error: Failed to query assignment by incident: {}", incidentId, e);
            throw new FirebaseException("Failed to read task assignment by incident", e);
        }
    }

    public List<Assignment> findByOfficerId(String officerId) {
        try {
            QuerySnapshot snapshot = firestore.collection(collectionName)
                    .whereEqualTo("officerId", officerId)
                    .get()
                    .get();

            List<Assignment> list = new ArrayList<>();
            for (QueryDocumentSnapshot document : snapshot.getDocuments()) {
                list.add(document.toObject(Assignment.class));
            }
            return list;
        } catch (Exception e) {
            log.error("Firestore Error: Failed to query assignments for officer: {}", officerId, e);
            throw new FirebaseException("Failed to read task assignments for officer", e);
        }
    }
}
