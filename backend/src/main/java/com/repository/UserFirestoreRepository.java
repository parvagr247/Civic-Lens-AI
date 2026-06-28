package com.repository;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.exception.FirebaseException;
import com.model.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Encapsulates Firestore operations for User documents.
 * Extends the abstract generic BaseFirestoreRepository to inherit standard CRUD routines.
 */
@Slf4j
@Repository
public class UserFirestoreRepository extends BaseFirestoreRepository<User> {

    public UserFirestoreRepository(Firestore firestore) {
        super(firestore, "users");
    }

    public void save(User user) {
        super.save(user.getId(), user);
    }

    public List<User> findAll() {
        return super.findAll(User.class);
    }

    public User findById(String id) {
        return super.findById(id, User.class);
    }

    /**
     * Retrieves a User document matching the unique email address.
     */
    public User findByEmail(String email) {
        log.info("Firestore: Querying user account by email: {}", email);
        try {
            QuerySnapshot snapshot = firestore.collection(collectionName)
                    .whereEqualTo("email", email.trim().toLowerCase())
                    .get()
                    .get();

            List<QueryDocumentSnapshot> documents = snapshot.getDocuments();
            if (!documents.isEmpty()) {
                return documents.get(0).toObject(User.class);
            }
            return null;
        } catch (Exception e) {
            log.error("Firestore Error: Failed to query user by email: {}", email, e);
            throw new FirebaseException("Failed to query user by email", e);
        }
    }
}
