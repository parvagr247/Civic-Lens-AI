package com.service;

import com.model.Comment;
import java.util.List;

/**
 * Service defining collaborative community features including comments, saves, follows, and shares.
 */
public interface CollaborationService {

    Comment addComment(String incidentId, String content, String parentId, String email);

    List<Comment> getComments(String incidentId);

    void likeComment(String commentId, String email);

    void followUser(String targetEmail, String email);

    void unfollowUser(String targetEmail, String email);

    List<String> getFollowing(String email);

    List<String> getFollowers(String email);

    void saveReport(String incidentId, String email);

    void unsaveReport(String incidentId, String email);

    List<String> getSavedReportIds(String email);

    void incrementShareCount(String incidentId);
}
