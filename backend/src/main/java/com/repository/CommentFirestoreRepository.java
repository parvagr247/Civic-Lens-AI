package com.repository;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.exception.FirebaseException;
import com.model.Comment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

/**
 * Encapsulates Firestore operations for Comment documents.
 * Extends the abstract generic BaseFirestoreRepository to inherit standard CRUD routines.
 */
@Slf4j
@Repository
public class CommentFirestoreRepository extends BaseFirestoreRepository<Comment> {

    public CommentFirestoreRepository(Firestore firestore) {
        super(firestore, "comments");
    }

    public void save(Comment comment) {
        super.save(comment.getId(), comment);
    }

    public Comment findById(String id) {
        return super.findById(id, Comment.class);
    }

    /**
     * Lists comments associated with an incident, sorted chronologically (ascending).
     */
    public List<Comment> findByIncidentId(String incidentId) {
        try {
            QuerySnapshot snapshot = firestore.collection(collectionName)
                    .whereEqualTo("incidentId", incidentId)
                    .get()
                    .get();

            List<Comment> list = new ArrayList<>();
            for (QueryDocumentSnapshot document : snapshot.getDocuments()) {
                list.add(document.toObject(Comment.class));
            }
            // Sort in memory to avoid composite index requirements
            list.sort((c1, c2) -> Long.compare(c1.getCreatedAt(), c2.getCreatedAt()));
            return list;
        } catch (Exception e) {
            log.error("Firestore Error: Failed to query comments for incident: {}", incidentId, e);
            throw new FirebaseException("Failed to read incident comments", e);
        }
    }

    /**
     * Lists comments submitted by a specific user.
     */
    public List<Comment> findByUserId(String userId) {
        try {
            com.google.cloud.firestore.QuerySnapshot snapshot = firestore.collection(collectionName)
                    .whereEqualTo("userId", userId)
                    .get()
                    .get();

            List<Comment> list = new ArrayList<>();
            for (com.google.cloud.firestore.QueryDocumentSnapshot document : snapshot.getDocuments()) {
                list.add(document.toObject(Comment.class));
            }
            list.sort((c1, c2) -> Long.compare(c2.getCreatedAt(), c1.getCreatedAt()));
            return list;
        } catch (Exception e) {
            log.error("Firestore Error: Failed to query comments for user: {}", userId, e);
            throw new FirebaseException("Failed to read user comments", e);
        }
    }
}
