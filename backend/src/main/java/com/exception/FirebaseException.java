package com.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a Firebase, Firestore, or Storage operation fails.
 */
public class FirebaseException extends BusinessException {

    public FirebaseException(String message) {
        super(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    public FirebaseException(String message, Throwable cause) {
        super(message, cause, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
