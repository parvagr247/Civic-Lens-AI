package com.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity tracking simulated OTP verification sessions for anonymous reports.
 * Maps directly to documents in the Firestore 'anonymous_trackings' collection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnonymousTracking {
    private String id;
    private String trackingId; // e.g. CL-2026-X8371
    private String emailOrPhone;
    private String otpCode;
    private Boolean verified;
    private String incidentId;
    private Long createdAt;
}
