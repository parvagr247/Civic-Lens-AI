package com.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Reddit-style comment entity supporting replies and upvotes.
 * Maps directly to documents in the Firestore 'comments' collection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Comment {
    private String id;
    private String incidentId;
    private String userId;
    private String userName;
    private String avatarUrl;
    private String content;
    private String parentId; // If populated, this comment is a nested reply
    private Integer likesCount;
    private List<String> likedBy; // List of userIds who liked this comment
    private Long createdAt;
}
