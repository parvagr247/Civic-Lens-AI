package com.repository;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.exception.FirebaseException;
import com.model.Follower;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

/**
 * Encapsulates Firestore operations for Follower documents.
 * Extends the abstract generic BaseFirestoreRepository to inherit standard CRUD routines.
 */
@Slf4j
@Repository
public class FollowerFirestoreRepository extends BaseFirestoreRepository<Follower> {

    public FollowerFirestoreRepository(Firestore firestore) {
        super(firestore, "followers");
    }

    public void save(Follower follower) {
        super.save(follower.getId(), follower);
    }

    public void delete(String id) {
        log.info("Firestore: Deleting follow connection: {}", id);
        try {
            firestore.collection(collectionName)
                    .document(id)
                    .delete()
                    .get();
        } catch (Exception e) {
            log.error("Firestore Error: Failed to delete follower connection: {}", id, e);
            throw new FirebaseException("Failed to remove follower relationship", e);
        }
    }

    public boolean exists(String userId, String followerId) {
        String id = userId + "_" + followerId;
        try {
            return firestore.collection(collectionName)
                    .document(id)
                    .get()
                    .get()
                    .exists();
        } catch (Exception e) {
            log.error("Firestore Error: Failed to check follower connection existence", e);
            return false;
        }
    }

    /**
     * Lists followers connection profiles who are following this user.
     */
    public List<Follower> findFollowers(String userId) {
        try {
            QuerySnapshot snapshot = firestore.collection(collectionName)
                    .whereEqualTo("userId", userId)
                    .get()
                    .get();

            List<Follower> list = new ArrayList<>();
            for (QueryDocumentSnapshot document : snapshot.getDocuments()) {
                list.add(document.toObject(Follower.class));
            }
            return list;
        } catch (Exception e) {
            log.error("Firestore Error: Failed to query followers list for user: {}", userId, e);
            throw new FirebaseException("Failed to query followers details", e);
        }
    }

    /**
     * Lists profiles that the target followerId is currently following.
     */
    public List<Follower> findFollowing(String followerId) {
        try {
            QuerySnapshot snapshot = firestore.collection(collectionName)
                    .whereEqualTo("followerId", followerId)
                    .get()
                    .get();

            List<Follower> list = new ArrayList<>();
            for (QueryDocumentSnapshot document : snapshot.getDocuments()) {
                list.add(document.toObject(Follower.class));
            }
            return list;
        } catch (Exception e) {
            log.error("Firestore Error: Failed to query following list for follower: {}", followerId, e);
            throw new FirebaseException("Failed to query following details", e);
        }
    }
}
