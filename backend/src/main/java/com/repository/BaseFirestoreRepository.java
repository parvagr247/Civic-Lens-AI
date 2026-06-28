package com.repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.exception.FirebaseException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;

/**
 * Abstract generic base repository to centralize Firestore CRUD operations.
 *
 * @param <T> Type of the entity domain model.
 */
@Slf4j
@RequiredArgsConstructor
public abstract class BaseFirestoreRepository<T> {

    protected final Firestore firestore;
    protected final String collectionName;

    public void save(String id, T entity) {
        log.info("Firestore: Saving document {} in collection '{}'", id, collectionName);
        try {
            ApiFuture<WriteResult> future = firestore.collection(collectionName)
                    .document(id)
                    .set(entity);
            future.get();
        } catch (Exception e) {
            log.error("Firestore Error: Failed to save document {} in {}", id, collectionName, e);
            throw new FirebaseException("Failed to persist record in " + collectionName, e);
        }
    }

    public T findById(String id, Class<T> clazz) {
        try {
            DocumentSnapshot snapshot = firestore.collection(collectionName)
                    .document(id)
                    .get()
                    .get();

            if (snapshot.exists()) {
                return snapshot.toObject(clazz);
            }
            return null;
        } catch (Exception e) {
            log.error("Firestore Error: Failed to fetch document {} from {}", id, collectionName, e);
            throw new FirebaseException("Failed to read record from " + collectionName, e);
        }
    }

    public List<T> findAll(Class<T> clazz) {
        try {
            QuerySnapshot snapshot = firestore.collection(collectionName)
                    .get()
                    .get();

            List<T> list = new ArrayList<>();
            for (QueryDocumentSnapshot document : snapshot.getDocuments()) {
                list.add(document.toObject(clazz));
            }
            return list;
        } catch (Exception e) {
            log.error("Firestore Error: Failed to query all documents from {}", collectionName, e);
            throw new FirebaseException("Failed to list database records from " + collectionName, e);
        }
    }

    public void delete(String id) {
        log.info("Firestore: Deleting document {} from collection '{}'", id, collectionName);
        try {
            firestore.collection(collectionName).document(id).delete().get();
        } catch (Exception e) {
            log.error("Firestore Error: Failed to delete document {} from {}", id, collectionName, e);
            throw new FirebaseException("Failed to delete record from " + collectionName, e);
        }
    }
}

