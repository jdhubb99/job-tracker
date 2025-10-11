package com.jhub.backend.dto;

import java.time.LocalDateTime;

/**
 * Response DTO for health check endpoints
 */
public record HealthResponse(
    String status,
    String message,
    LocalDateTime timestamp
) {
    /**
     * Creates a successful health response
     *
     * @param message the health message
     * @return HealthResponse with UP status
     */
    public static HealthResponse up(String message) {
        return new HealthResponse("UP", message, LocalDateTime.now());
    }

    /**
     * Creates a failed health response
     *
     * @param message the error message
     * @return HealthResponse with DOWN status
     */
    public static HealthResponse down(String message) {
        return new HealthResponse("DOWN", message, LocalDateTime.now());
    }
}
