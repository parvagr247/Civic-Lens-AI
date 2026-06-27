package com.service.impl;

import com.model.*;
import com.repository.*;
import com.service.GamificationService;
import com.service.NotificationService;
import com.service.OfficerService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class OfficerServiceImpl implements OfficerService {

    private final OfficerFirestoreRepository officerRepository;
    private final AssignmentFirestoreRepository assignmentRepository;
    private final UserFirestoreRepository userRepository;
    private final MessageFirestoreRepository messageRepository;
    private final IncidentRepository incidentRepository;
    private final NotificationService notificationService;
    private final GamificationService gamificationService;
    private final PasswordEncoder passwordEncoder;
    private final CitizenProfileFirestoreRepository citizenProfileRepository;

    public OfficerServiceImpl(
            OfficerFirestoreRepository officerRepository,
            AssignmentFirestoreRepository assignmentRepository,
            UserFirestoreRepository userRepository,
            MessageFirestoreRepository messageRepository,
            IncidentRepository incidentRepository,
            NotificationService notificationService,
            GamificationService gamificationService,
            PasswordEncoder passwordEncoder,
            CitizenProfileFirestoreRepository citizenProfileRepository) {
        this.officerRepository = officerRepository;
        this.assignmentRepository = assignmentRepository;
        this.userRepository = userRepository;
        this.messageRepository = messageRepository;
        this.incidentRepository = incidentRepository;
        this.notificationService = notificationService;
        this.gamificationService = gamificationService;
        this.passwordEncoder = passwordEncoder;
        this.citizenProfileRepository = citizenProfileRepository;
    }

    @Override
    public Officer createOfficer(String name, String email, String password, String department) {
        log.info("Officer Service: Creating new officer user account: {}", email);
        if (userRepository.findByEmail(email) != null) {
            throw new IllegalArgumentException("User account email already exists.");
        }

        String userId = UUID.randomUUID().toString();
        User user = User.builder()
                .id(userId)
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(UserRole.ROLE_OFFICER)
                .createdAt(System.currentTimeMillis())
                .build();
        userRepository.save(user);

        // Seed CitizenProfile for officer so dashboard loaders don't break
        try {
            CitizenProfile profile = CitizenProfile.builder()
                    .userId(userId)
                    .name(name)
                    .points(0)
                    .level("Municipal Officer")
                    .rank(0)
                    .bio("Authorized field officer for department: " + department)
                    .avatarUrl("https://api.dicebear.com/7.x/bottts/svg?seed=" + name)
                    .savedIncidents(Collections.emptyList())
                    .updatedAt(System.currentTimeMillis())
                    .build();
            citizenProfileRepository.save(profile);
        } catch (Exception e) {
            log.warn("Officer Service warning: Failed to seed officer profile card: {}", e.getMessage());
        }

        Officer officer = Officer.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .name(name)
                .email(email)
                .department(department)
                .active(true)
                .performanceScore(5.0)
                .createdAt(System.currentTimeMillis())
                .build();
        officerRepository.save(officer);

        return officer;
    }

    @Override
    public List<Officer> getAllOfficers() {
        return officerRepository.findAll();
    }

    @Override
    public Officer getOfficerByEmail(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) return null;
        return officerRepository.findByUserId(user.getId());
    }

    @Override
    public void assignIncident(String incidentId, String officerId, Long deadline, String priority, String instructions) {
        log.info("Officer Service: Assigning incident {} to officer {}", incidentId, officerId);
        Incident incident = incidentRepository.findById(incidentId);
        if (incident == null) throw new IllegalArgumentException("Incident not found");

        Officer officer = officerRepository.findById(officerId);
        if (officer == null) throw new IllegalArgumentException("Officer not found");

        // Map status to INVESTIGATING or IN_PROGRESS
        incident.setStatus(IncidentStatus.INVESTIGATING);
        incident.setUpdatedAt(System.currentTimeMillis());
        incidentRepository.save(incident);

        Assignment assignment = Assignment.builder()
                .id(UUID.randomUUID().toString())
                .incidentId(incidentId)
                .officerId(officerId)
                .officerName(officer.getName())
                .assignedAt(System.currentTimeMillis())
                .deadline(deadline)
                .priority(priority)
                .instructions(instructions)
                .status("ASSIGNED")
                .internalNotes("")
                .updatedAt(System.currentTimeMillis())
                .build();

        assignmentRepository.save(assignment);

        // Alert the assigned Officer
        notificationService.notify(
                officer.getUserId(),
                "Municipality Dispatch",
                "ASSIGNMENT",
                "You have been assigned to: \"" + incident.getTitle() + "\" with priority " + priority,
                incidentId
        );
    }

    @Override
    public Assignment getAssignmentForIncident(String incidentId) {
        return assignmentRepository.findByIncidentId(incidentId);
    }

    @Override
    public List<Assignment> getAssignmentsForOfficer(String email) {
        Officer officer = getOfficerByEmail(email);
        if (officer == null) return Collections.emptyList();
        return assignmentRepository.findByOfficerId(officer.getId());
    }

    @Override
    public void updateAssignmentStatus(String assignmentId, String status, String internalNotes, String completionImageUrl, String completionReport) {
        log.info("Officer Service: Updating status of assignment {} to {}", assignmentId, status);
        Assignment assignment = assignmentRepository.findById(assignmentId);
        if (assignment == null) throw new IllegalArgumentException("Assignment task not found");

        assignment.setStatus(status);
        assignment.setInternalNotes(internalNotes);
        assignment.setCompletionImageUrl(completionImageUrl);
        assignment.setCompletionReport(completionReport);
        assignment.setUpdatedAt(System.currentTimeMillis());
        assignmentRepository.save(assignment);

        Incident incident = incidentRepository.findById(assignment.getIncidentId());
        if (incident != null) {
            if ("IN_PROGRESS".equalsIgnoreCase(status)) {
                incident.setStatus(IncidentStatus.IN_PROGRESS);
                incident.setUpdatedAt(System.currentTimeMillis());
                incidentRepository.save(incident);
            } else if ("COMPLETED".equalsIgnoreCase(status)) {
                incident.setStatus(IncidentStatus.RESOLVED);
                incident.setUpdatedAt(System.currentTimeMillis());
                incidentRepository.save(incident);

                // Reward points to the citizen who reported it
                if (incident.getReportedBy() != null) {
                    User reporter = userRepository.findByEmail(incident.getReportedBy());
                    if (reporter != null) {
                        try {
                            gamificationService.rewardPoints(reporter.getId(), "ISSUE_RESOLVED", incident.getId());
                            notificationService.notify(
                                    reporter.getId(),
                                    assignment.getOfficerName(),
                                    "RESOLUTION",
                                    "Your reported issue: \"" + incident.getTitle() + "\" has been resolved!",
                                    incident.getId()
                             );
                        } catch (Exception e) {
                            log.warn("Gamification warning: Failed to reward resolution points", e);
                        }
                    }
                }
            }
        }
    }

    @Override
    public void sendInternalMessage(String chatRoomId, String text, String senderEmail) {
        log.info("Officer Service: Sending internal dispatch message to room: {}", chatRoomId);
        User user = userRepository.findByEmail(senderEmail);
        if (user == null) return;

        String senderName = user.getEmail();
        if (user.getRole() == UserRole.ROLE_OFFICER) {
            Officer officer = officerRepository.findByUserId(user.getId());
            if (officer != null) senderName = officer.getName();
        } else {
            CitizenProfile profile = citizenProfileRepository.findByUserId(user.getId());
            if (profile != null) senderName = profile.getName();
        }

        Message message = Message.builder()
                .id(UUID.randomUUID().toString())
                .chatRoomId(chatRoomId)
                .senderId(user.getId())
                .senderName(senderName)
                .text(text)
                .timestamp(System.currentTimeMillis())
                .build();

        messageRepository.save(message);
    }

    @Override
    public List<Message> getChatMessages(String chatRoomId) {
        return messageRepository.findByChatRoomId(chatRoomId);
    }
}
