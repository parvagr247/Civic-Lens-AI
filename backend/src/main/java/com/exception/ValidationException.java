package com.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when validation constraints fail.
 */
public class ValidationException extends BusinessException {

    public ValidationException(String message) {
        super(message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
