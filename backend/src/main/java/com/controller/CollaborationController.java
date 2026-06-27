package com.controller;

import com.dto.ApiResponse;
import com.model.Comment;
import com.service.CollaborationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller exposing endpoints for social community collaboration (comments, follows, bookmarks).
 */
@Slf4j
@RestController
@RequestMapping("/api")
@lombok.RequiredArgsConstructor
public class CollaborationController {

    private final CollaborationService collaborationService;

    @PostMapping("/comments")
    public ResponseEntity<ApiResponse<Comment>> addComment(
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        String incidentId = request.get("incidentId");
        String content = request.get("content");
        String parentId = request.get("parentId"); // Can be null
        String email = authentication.getName();

        log.info("REST: Request to add comment to incident {} by {}", incidentId, email);
        Comment comment = collaborationService.addComment(incidentId, content, parentId, email);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                comment,
                "Comment posted successfully.",
                HttpStatus.CREATED.value()
        ));
    }

    @GetMapping("/comments/{incidentId}")
    public ResponseEntity<ApiResponse<List<Comment>>> getComments(@PathVariable String incidentId) {
        log.info("REST: Request to retrieve comments for incident {}", incidentId);
        List<Comment> comments = collaborationService.getComments(incidentId);

        return ResponseEntity.ok(ApiResponse.success(
                comments,
                "Comments list retrieved successfully.",
                HttpStatus.OK.value()
        ));
    }

    @PostMapping("/comments/{commentId}/like")
    public ResponseEntity<ApiResponse<Void>> likeComment(
            @PathVariable String commentId,
            Authentication authentication) {
        String email = authentication.getName();
        log.info("REST: Request to toggle like on comment {} by {}", commentId, email);
        collaborationService.likeComment(commentId, email);

        return ResponseEntity.ok(ApiResponse.success(
                "Comment like toggled.",
                HttpStatus.OK.value()
        ));
    }

    @PostMapping("/follow")
    public ResponseEntity<ApiResponse<Void>> followUser(
            @RequestParam String targetEmail,
            Authentication authentication) {
        String email = authentication.getName();
        log.info("REST: Request from {} to follow {}", email, targetEmail);
        collaborationService.followUser(targetEmail, email);

        return ResponseEntity.ok(ApiResponse.success(
                "Successfully followed contributor.",
                HttpStatus.OK.value()
        ));
    }

    @DeleteMapping("/follow")
    public ResponseEntity<ApiResponse<Void>> unfollowUser(
            @RequestParam String targetEmail,
            Authentication authentication) {
        String email = authentication.getName();
        log.info("REST: Request from {} to unfollow {}", email, targetEmail);
        collaborationService.unfollowUser(targetEmail, email);

        return ResponseEntity.ok(ApiResponse.success(
                "Successfully unfollowed contributor.",
                HttpStatus.OK.value()
        ));
    }

    @GetMapping("/follow/following")
    public ResponseEntity<ApiResponse<List<String>>> getFollowing(Authentication authentication) {
        String email = authentication.getName();
        List<String> list = collaborationService.getFollowing(email);

        return ResponseEntity.ok(ApiResponse.success(
                list,
                "Following list retrieved.",
                HttpStatus.OK.value()
        ));
    }

    @PostMapping("/save/{incidentId}")
    public ResponseEntity<ApiResponse<Void>> saveReport(
            @PathVariable String incidentId,
            Authentication authentication) {
        String email = authentication.getName();
        log.info("REST: Request from {} to bookmark incident {}", email, incidentId);
        collaborationService.saveReport(incidentId, email);

        return ResponseEntity.ok(ApiResponse.success(
                "Incident bookmarked successfully.",
                HttpStatus.OK.value()
        ));
    }

    @DeleteMapping("/save/{incidentId}")
    public ResponseEntity<ApiResponse<Void>> unsaveReport(
            @PathVariable String incidentId,
            Authentication authentication) {
        String email = authentication.getName();
        log.info("REST: Request from {} to remove bookmark incident {}", email, incidentId);
        collaborationService.unsaveReport(incidentId, email);

        return ResponseEntity.ok(ApiResponse.success(
                "Bookmark removed successfully.",
                HttpStatus.OK.value()
        ));
    }

    @GetMapping("/save/saved")
    public ResponseEntity<ApiResponse<List<String>>> getSavedReportIds(Authentication authentication) {
        String email = authentication.getName();
        List<String> list = collaborationService.getSavedReportIds(email);

        return ResponseEntity.ok(ApiResponse.success(
                list,
                "Saved report bookmarks retrieved successfully.",
                HttpStatus.OK.value()
        ));
    }

    @PostMapping("/share/{incidentId}")
    public ResponseEntity<ApiResponse<Void>> incrementShareCount(@PathVariable String incidentId) {
        log.info("REST: Request to log share count for incident {}", incidentId);
        collaborationService.incrementShareCount(incidentId);

        return ResponseEntity.ok(ApiResponse.success(
                "Share log recorded.",
                HttpStatus.OK.value()
        ));
    }
}
