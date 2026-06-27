package com.service;

import com.model.Assignment;
import com.model.Message;
import com.model.Officer;
import java.util.List;

/**
 * Service orchestrating officer profiles, department task dispatches, and chats.
 */
public interface OfficerService {

    Officer createOfficer(String name, String email, String password, String department);

    List<Officer> getAllOfficers();

    Officer getOfficerByEmail(String email);

    void assignIncident(String incidentId, String officerId, Long deadline, String priority, String instructions);

    Assignment getAssignmentForIncident(String incidentId);

    List<Assignment> getAssignmentsForOfficer(String email);

    void updateAssignmentStatus(String assignmentId, String status, String internalNotes, String completionImageUrl, String completionReport);

    void sendInternalMessage(String chatRoomId, String text, String senderEmail);

    List<Message> getChatMessages(String chatRoomId);
}
