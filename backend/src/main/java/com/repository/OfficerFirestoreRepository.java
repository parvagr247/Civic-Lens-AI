package com.repository;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.exception.FirebaseException;
import com.model.Officer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Encapsulates Firestore operations for Officer documents.
 * Extends the abstract generic BaseFirestoreRepository to inherit standard CRUD routines.
 */
@Slf4j
@Repository
public class OfficerFirestoreRepository extends BaseFirestoreRepository<Officer> {

    public OfficerFirestoreRepository(Firestore firestore) {
        super(firestore, "officers");
    }

    public void save(Officer officer) {
        super.save(officer.getId(), officer);
    }

    public Officer findById(String id) {
        return super.findById(id, Officer.class);
    }

    public List<Officer> findAll() {
        return super.findAll(Officer.class);
    }

    public Officer findByUserId(String userId) {
        try {
            QuerySnapshot snapshot = firestore.collection(collectionName)
                    .whereEqualTo("userId", userId)
                    .get()
                    .get();

            List<QueryDocumentSnapshot> documents = snapshot.getDocuments();
            if (!documents.isEmpty()) {
                return documents.get(0).toObject(Officer.class);
            }
            return null;
        } catch (Exception e) {
            log.error("Firestore Error: Failed to query officer by User ID: {}", userId, e);
            throw new FirebaseException("Failed to query officer profile", e);
        }
    }
}
