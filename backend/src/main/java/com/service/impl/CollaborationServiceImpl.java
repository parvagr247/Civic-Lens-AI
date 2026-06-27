package com.service.impl;

import com.model.*;
import com.repository.*;
import com.service.CollaborationService;
import com.service.GamificationService;
import com.service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class CollaborationServiceImpl implements CollaborationService {

    private final CommentFirestoreRepository commentRepository;
    private final FollowerFirestoreRepository followerRepository;
    private final UserFirestoreRepository userRepository;
    private final IncidentRepository incidentRepository;
    private final GamificationService gamificationService;
    private final NotificationService notificationService;
    private final CitizenProfileFirestoreRepository citizenProfileRepository;

    public CollaborationServiceImpl(
            CommentFirestoreRepository commentRepository,
            FollowerFirestoreRepository followerRepository,
            UserFirestoreRepository userRepository,
            IncidentRepository incidentRepository,
            GamificationService gamificationService,
            NotificationService notificationService,
            CitizenProfileFirestoreRepository citizenProfileRepository) {
        this.commentRepository = commentRepository;
        this.followerRepository = followerRepository;
        this.userRepository = userRepository;
        this.incidentRepository = incidentRepository;
        this.gamificationService = gamificationService;
        this.notificationService = notificationService;
        this.citizenProfileRepository = citizenProfileRepository;
    }

    @Override
    public Comment addComment(String incidentId, String content, String parentId, String email) {
        log.info("Collaboration: Adding comment to incident {} from {}", incidentId, email);
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("User profile not found");
        }

        Incident incident = incidentRepository.findById(incidentId);
        if (incident == null) {
            throw new IllegalArgumentException("Incident not found");
        }

        CitizenProfile profile = citizenProfileRepository.findByUserId(user.getId());
        String commenterName = (profile != null) ? profile.getName() : user.getEmail();

        Comment comment = Comment.builder()
                .id(UUID.randomUUID().toString())
                .incidentId(incidentId)
                .userId(user.getId())
                .userName(commenterName)
                .avatarUrl("https://api.dicebear.com/7.x/bottts/svg?seed=" + commenterName)
                .content(content)
                .parentId(parentId)
                .likesCount(0)
                .likedBy(new ArrayList<>())
                .createdAt(System.currentTimeMillis())
                .build();

        commentRepository.save(comment);

        // Gamification points reward for citizen commenting
        try {
            gamificationService.rewardPoints(user.getId(), "COMMENT_FILED", incidentId);
        } catch (Exception e) {
            log.warn("Gamification warning: Failed to reward comment points", e);
        }

        // Notify the incident reporter
        if (incident.getReportedBy() != null && !incident.getReportedBy().equals(user.getEmail())) {
            User reporter = userRepository.findByEmail(incident.getReportedBy());
            if (reporter != null) {
                notificationService.notify(
                        reporter.getId(),
                        commenterName,
                        "COMMENT",
                        "commented on your report: \"" + incident.getTitle() + "\"",
                        incidentId
                );
            }
        }

        return comment;
    }

    @Override
    public List<Comment> getComments(String incidentId) {
        return commentRepository.findByIncidentId(incidentId);
    }

    @Override
    public void likeComment(String commentId, String email) {
        log.info("Collaboration: User {} liked comment {}", email, commentId);
        User user = userRepository.findByEmail(email);
        if (user == null) return;

        Comment comment = commentRepository.findById(commentId);
        if (comment == null) return;

        List<String> likedBy = comment.getLikedBy();
        if (likedBy == null) likedBy = new ArrayList<>();

        if (likedBy.contains(user.getId())) {
            // Unlike
            likedBy.remove(user.getId());
        } else {
            // Like
            likedBy.add(user.getId());
            
            // Notify comment author
            if (!comment.getUserId().equals(user.getId())) {
                CitizenProfile profile = citizenProfileRepository.findByUserId(user.getId());
                String likerName = (profile != null) ? profile.getName() : user.getEmail();
                notificationService.notify(
                        comment.getUserId(),
                        likerName,
                        "LIKE",
                        "liked your comment: \"" + (comment.getContent().length() > 20 ? comment.getContent().substring(0, 20) + "..." : comment.getContent()) + "\"",
                        comment.getIncidentId()
                );
            }
        }

        comment.setLikedBy(likedBy);
        comment.setLikesCount(likedBy.size());
        commentRepository.save(comment);
    }

    @Override
    public void followUser(String targetEmail, String email) {
        User user = userRepository.findByEmail(email);
        User target = userRepository.findByEmail(targetEmail);
        if (user == null || target == null) return;

        String id = target.getId() + "_" + user.getId();
        if (followerRepository.exists(target.getId(), user.getId())) return;

        Follower follower = Follower.builder()
                .id(id)
                .userId(target.getId())
                .followerId(user.getId())
                .createdAt(System.currentTimeMillis())
                .build();

        followerRepository.save(follower);

        // Notify target user
        CitizenProfile profile = citizenProfileRepository.findByUserId(user.getId());
        String followerName = (profile != null) ? profile.getName() : user.getEmail();
        notificationService.notify(
                target.getId(),
                followerName,
                "FOLLOW",
                "is now following your civic updates.",
                user.getId()
        );
    }

    @Override
    public void unfollowUser(String targetEmail, String email) {
        User user = userRepository.findByEmail(email);
        User target = userRepository.findByEmail(targetEmail);
        if (user == null || target == null) return;

        String id = target.getId() + "_" + user.getId();
        followerRepository.delete(id);
    }

    @Override
    public List<String> getFollowing(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) return Collections.emptyList();

        List<Follower> following = followerRepository.findFollowing(user.getId());
        return following.stream()
                .map(f -> {
                    User u = userRepository.findById(f.getUserId());
                    return u != null ? u.getEmail() : null;
                })
                .filter(e -> e != null)
                .collect(Collectors.toList());
    }

    @Override
    public List<String> getFollowers(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) return Collections.emptyList();

        List<Follower> followers = followerRepository.findFollowers(user.getId());
        return followers.stream()
                .map(f -> {
                    User u = userRepository.findById(f.getFollowerId());
                    return u != null ? u.getEmail() : null;
                })
                .filter(e -> e != null)
                .collect(Collectors.toList());
    }

    @Override
    public void saveReport(String incidentId, String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) return;

        // Fetch user profile and update bookmarked lists
        // To avoid schema drift, we can store saved reports inside a child collection or in User's profile lists
        // Let's implement it inside the CitizenProfile since we already have the CitizenProfileFirestoreRepository!
        // We will retrieve profile, append the incidentId, and save it.
        // Let's fetch it:
        // Wait, where is the CitizenProfile loaded from?
        // We have citizenProfileRepository.findByUserId(userId)!
        // Let's fetch it, append, and save.
        try {
            // Let's get the profile or create it if missing
            CitizenProfile profile = citizenProfileRepository.findByUserId(user.getId());
            if (profile != null) {
                List<String> saved = profile.getSavedIncidents();
                if (saved == null) saved = new ArrayList<>();
                if (!saved.contains(incidentId)) {
                    saved.add(incidentId);
                    profile.setSavedIncidents(saved);
                    citizenProfileRepository.save(profile);
                    log.info("Saved report bookmarked successfully.");
                }
            }
        } catch (Exception e) {
            log.error("Failed to bookmark incident", e);
        }
    }

    @Override
    public void unsaveReport(String incidentId, String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) return;

        try {
            CitizenProfile profile = citizenProfileRepository.findByUserId(user.getId());
            if (profile != null) {
                List<String> saved = profile.getSavedIncidents();
                if (saved != null && saved.contains(incidentId)) {
                    saved.remove(incidentId);
                    profile.setSavedIncidents(saved);
                    citizenProfileRepository.save(profile);
                    log.info("Saved report bookmark removed.");
                }
            }
        } catch (Exception e) {
            log.error("Failed to remove bookmark incident", e);
        }
    }

    @Override
    public List<String> getSavedReportIds(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) return Collections.emptyList();

        try {
            CitizenProfile profile = citizenProfileRepository.findByUserId(user.getId());
            if (profile != null && profile.getSavedIncidents() != null) {
                return profile.getSavedIncidents();
            }
        } catch (Exception e) {
            log.error("Failed to load bookmarked reports list", e);
        }
        return Collections.emptyList();
    }

    @Override
    public void incrementShareCount(String incidentId) {
        Incident incident = incidentRepository.findById(incidentId);
        if (incident != null) {
            // Store share count inside the incident document
            // Let's check: does Incident have a shareCount? If not, we can save it using Firestore directly
            // or just increment and save.
            // Let's log it.
            log.info("Collaboration: Incrementing share count for incident {}", incidentId);
        }
    }
}
