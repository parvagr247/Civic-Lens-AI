package com.controller;

import com.dto.ApiResponse;
import com.dto.UserProfileResponse;
import com.model.CitizenProfile;
import com.model.Comment;
import com.model.Incident;
import com.model.User;
import com.repository.CitizenProfileFirestoreRepository;
import com.repository.CommentFirestoreRepository;
import com.repository.FollowerFirestoreRepository;
import com.repository.IncidentRepository;
import com.repository.UserFirestoreRepository;
import com.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller exposing endpoints for citizen profiles, details, and editing actions.
 */
@Slf4j
@RestController
@RequestMapping("/api/profile")
@lombok.RequiredArgsConstructor
public class ProfileController {

    private final UserFirestoreRepository userRepository;
    private final CitizenProfileFirestoreRepository profileRepository;
    private final FollowerFirestoreRepository followerRepository;
    private final IncidentRepository incidentRepository;
    private final CommentFirestoreRepository commentRepository;

    /**
     * Retrieves the public profile details for a given userId.
     */
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(
            @PathVariable String userId,
            Authentication authentication) {
        log.info("REST: Request to fetch profile details for identifier: {}", userId);

        User profileUser = null;
        if (userId.contains("@")) {
            profileUser = userRepository.findByEmail(userId);
        } else {
            // Find by ID
            final String targetId = userId;
            profileUser = userRepository.findAll().stream()
                    .filter(u -> u.getId().equals(targetId))
                    .findFirst()
                    .orElse(null);
        }

        if (profileUser == null) {
            log.warn("REST Error: User account not found for: {}", userId);
            throw new ResourceNotFoundException("User account not found.");
        }

        String actualUserId = profileUser.getId();
        CitizenProfile citizenProfile = profileRepository.findByUserId(actualUserId);
        if (citizenProfile == null) {
            citizenProfile = CitizenProfile.builder()
                    .userId(actualUserId)
                    .name(profileUser.getEmail().split("@")[0])
                    .points(0)
                    .level("Active Citizen")
                    .rank(100)
                    .reportsSubmitted(0)
                    .reportsResolved(0)
                    .city("Portland")
                    .state("Oregon")
                    .country("United States")
                    .unlockedAchievements(List.of())
                    .savedIncidents(List.of())
                    .build();
        }

        List<Incident> incidents = incidentRepository.findByReportedBy(profileUser.getEmail());

        // Fetch user comments
        List<Comment> comments = commentRepository.findByUserId(actualUserId);

        // Fetch followers / following count
        int followerCount = followerRepository.findFollowers(actualUserId).size();
        int followingCount = followerRepository.findFollowing(actualUserId).size();

        // Check if currently logged in user is following this profile
        boolean isFollowing = false;
        if (authentication != null) {
            User currentUser = userRepository.findByEmail(authentication.getName());
            if (currentUser != null) {
                isFollowing = followerRepository.exists(actualUserId, currentUser.getId());
            }
        }

        UserProfileResponse response = UserProfileResponse.builder()
                .profile(citizenProfile)
                .followerCount(followerCount)
                .followingCount(followingCount)
                .isFollowing(isFollowing)
                .reportedIncidents(incidents)
                .comments(comments)
                .build();

        return ResponseEntity.ok(ApiResponse.success(
                response,
                "User profile retrieved successfully.",
                HttpStatus.OK.value()
        ));
    }

    /**
     * Updates profile details (bio, name, avatarUrl, coverImageUrl) for the authenticated user.
     */
    @PutMapping
    public ResponseEntity<ApiResponse<CitizenProfile>> updateProfile(
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        String email = authentication.getName();
        log.info("REST: Request from {} to update profile", email);

        User currentUser = userRepository.findByEmail(email);
        if (currentUser == null) {
            throw new ResourceNotFoundException("Authenticated user account not found.");
        }

        CitizenProfile profile = profileRepository.findByUserId(currentUser.getId());
        if (profile == null) {
            // If profile does not exist yet, provision a default one
            profile = CitizenProfile.builder()
                    .userId(currentUser.getId())
                    .name(currentUser.getEmail().split("@")[0])
                    .points(0)
                    .level("Active Citizen")
                    .rank(100)
                    .reportsSubmitted(0)
                    .reportsResolved(0)
                    .city("Portland")
                    .state("Oregon")
                    .country("United States")
                    .unlockedAchievements(List.of())
                    .savedIncidents(List.of())
                    .build();
        }

        if (request.containsKey("name") && request.get("name") != null) {
            profile.setName(request.get("name"));
        }
        if (request.containsKey("bio")) {
            profile.setBio(request.get("bio"));
        }
        if (request.containsKey("avatarUrl")) {
            profile.setAvatarUrl(request.get("avatarUrl"));
        }
        if (request.containsKey("coverImageUrl")) {
            profile.setCoverImageUrl(request.get("coverImageUrl"));
        }
        if (request.containsKey("city")) {
            profile.setCity(request.get("city"));
        }
        if (request.containsKey("state")) {
            profile.setState(request.get("state"));
        }
        if (request.containsKey("country")) {
            profile.setCountry(request.get("country"));
        }
        profile.setUpdatedAt(System.currentTimeMillis());

        profileRepository.save(profile);

        return ResponseEntity.ok(ApiResponse.success(
                profile,
                "Profile updated successfully.",
                HttpStatus.OK.value()
        ));
    }
}
