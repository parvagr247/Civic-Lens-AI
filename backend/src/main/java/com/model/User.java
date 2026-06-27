package com.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * User account credentials and role metadata.
 * Maps directly to documents in the Firestore 'users' collection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    private String id;
    private String email;
    private String password; // BCrypt hashed password
    private UserRole role;
    private Long createdAt;
}
