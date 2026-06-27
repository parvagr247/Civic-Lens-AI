package com.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when an issue occurs during AI analysis or orchestration.
 */
public class AIException extends BusinessException {

    public AIException(String message) {
        super(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    public AIException(String message, Throwable cause) {
        super(message, cause, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
