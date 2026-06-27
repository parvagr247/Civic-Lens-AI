package com.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity mapping citizen follow relationships.
 * Maps to documents in the Firestore 'followers' collection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Follower {
    private String id; // unique combination: userId_followerId
    private String userId;     // Account being followed
    private String followerId; // Account who follows
    private Long createdAt;
}
