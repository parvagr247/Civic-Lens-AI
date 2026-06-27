package com.service;

import com.model.Notification;
import java.util.List;

/**
 * Service defining notification operations for recipient inboxes.
 */
public interface NotificationService {

    void notify(String recipientId, String senderName, String type, String message, String referenceId);

    List<Notification> getNotifications(String email);

    void markAllAsRead(String email);
}
