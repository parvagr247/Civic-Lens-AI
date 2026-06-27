package com.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Enterprise API response wrapper that enforces uniformity across all endpoints.
 *
 * @param <T> Type of data payload.
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private String message;
    private String timestamp;
    private T data;
    private List<String> errors;
    private int statusCode;

    /**
     * Helper to generate a success API response with data.
     */
    public static <T> ApiResponse<T> success(T data, String message, int statusCode) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .timestamp(com.util.DateUtils.getCurrentTimestampIso())
                .data(data)
                .statusCode(statusCode)
                .build();
    }

    /**
     * Helper to generate a success API response without data.
     */
    public static ApiResponse<Void> success(String message, int statusCode) {
        return ApiResponse.<Void>builder()
                .success(true)
                .message(message)
                .timestamp(com.util.DateUtils.getCurrentTimestampIso())
                .statusCode(statusCode)
                .build();
    }

    /**
     * Helper to generate an error response.
     */
    public static ApiResponse<Void> error(String message, int statusCode, List<String> errors) {
        return ApiResponse.<Void>builder()
                .success(false)
                .message(message)
                .timestamp(com.util.DateUtils.getCurrentTimestampIso())
                .errors(errors)
                .statusCode(statusCode)
                .build();
    }
}
