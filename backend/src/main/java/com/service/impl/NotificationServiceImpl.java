package com.service.impl;

import com.model.Notification;
import com.model.User;
import com.repository.NotificationFirestoreRepository;
import com.repository.UserFirestoreRepository;
import com.service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationFirestoreRepository notificationRepository;
    private final UserFirestoreRepository userRepository;

    public NotificationServiceImpl(
            NotificationFirestoreRepository notificationRepository,
            UserFirestoreRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void notify(String recipientId, String senderName, String type, String message, String referenceId) {
        log.info("Notification: Dispatching alert to: {}, type: {}", recipientId, type);
        Notification notification = Notification.builder()
                .id(UUID.randomUUID().toString())
                .recipientId(recipientId)
                .senderName(senderName)
                .type(type)
                .message(message)
                .referenceId(referenceId)
                .read(false)
                .createdAt(System.currentTimeMillis())
                .build();

        notificationRepository.save(notification);
    }

    @Override
    public List<Notification> getNotifications(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) return Collections.emptyList();

        return notificationRepository.findByRecipientId(user.getId());
    }

    @Override
    public void markAllAsRead(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) return;

        log.info("Notification: Clearing unread inbox for user: {}", email);
        List<Notification> list = notificationRepository.findByRecipientId(user.getId());
        for (Notification notification : list) {
            if (!notification.getRead()) {
                notification.setRead(true);
                notificationRepository.save(notification);
            }
        }
    }
}
