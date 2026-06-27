package com.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Municipal field officer entity.
 * Maps directly to documents in the Firestore 'officers' collection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Officer {
    private String id;
    private String userId; // Link to users document
    private String name;
    private String email;
    private String department; // e.g. "Public Works", "Sanitation"
    private Boolean active;
    private Double performanceScore; // 0.0 to 5.0 rating
    private Long createdAt;
}
