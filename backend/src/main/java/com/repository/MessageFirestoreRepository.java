package com.repository;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.exception.FirebaseException;
import com.model.Message;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

/**
 * Encapsulates Firestore operations for Message documents.
 * Extends the abstract generic BaseFirestoreRepository to inherit standard CRUD routines.
 */
@Slf4j
@Repository
public class MessageFirestoreRepository extends BaseFirestoreRepository<Message> {

    public MessageFirestoreRepository(Firestore firestore) {
        super(firestore, "messages");
    }

    public void save(Message message) {
        super.save(message.getId(), message);
    }

    /**
     * Lists all messages in a chat room, sorted chronologically (ascending).
     */
    public List<Message> findByChatRoomId(String chatRoomId) {
        try {
            QuerySnapshot snapshot = firestore.collection(collectionName)
                    .whereEqualTo("chatRoomId", chatRoomId)
                    .get()
                    .get();

            List<Message> list = new ArrayList<>();
            for (QueryDocumentSnapshot document : snapshot.getDocuments()) {
                list.add(document.toObject(Message.class));
            }
            // Sort in memory to avoid composite index requirements
            list.sort((m1, m2) -> Long.compare(m1.getTimestamp(), m2.getTimestamp()));
            return list;
        } catch (Exception e) {
            log.error("Firestore Error: Failed to query messages in room: {}", chatRoomId, e);
            throw new FirebaseException("Failed to query messages database", e);
        }
    }
}
