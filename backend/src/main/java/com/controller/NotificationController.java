package com.controller;

import com.dto.ApiResponse;
import com.model.Notification;
import com.service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller exposing endpoints for checking citizen/officer notification hubs.
 */
@Slf4j
@RestController
@RequestMapping("/api/notifications")
@lombok.RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Notification>>> getNotifications(Authentication authentication) {
        String email = authentication.getName();
        log.info("REST: Fetching alerts list for {}", email);
        List<Notification> list = notificationService.getNotifications(email);

        return ResponseEntity.ok(ApiResponse.success(
                list,
                "Notifications list compiled successfully.",
                HttpStatus.OK.value()
        ));
    }

    @PostMapping("/read")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(Authentication authentication) {
        String email = authentication.getName();
        log.info("REST: Request to mark all notifications read for {}", email);
        notificationService.markAllAsRead(email);

        return ResponseEntity.ok(ApiResponse.success(
                "Notifications successfully marked read.",
                HttpStatus.OK.value()
        ));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@org.springframework.web.bind.annotation.PathVariable String id, Authentication authentication) {
        String email = authentication.getName();
        log.info("REST: Mark notification {} read for {}", id, email);
        notificationService.markAsRead(email, id);

        return ResponseEntity.ok(ApiResponse.success(
                "Notification marked read.",
                HttpStatus.OK.value()
        ));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(@org.springframework.web.bind.annotation.PathVariable String id, Authentication authentication) {
        String email = authentication.getName();
        log.info("REST: Delete notification {} for {}", id, email);
        notificationService.deleteNotification(email, id);

        return ResponseEntity.ok(ApiResponse.success(
                "Notification deleted successfully.",
                HttpStatus.OK.value()
        ));
    }

    @org.springframework.web.bind.annotation.DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteAllNotifications(Authentication authentication) {
        String email = authentication.getName();
        log.info("REST: Delete all notifications for {}", email);
        notificationService.deleteAllNotifications(email);

        return ResponseEntity.ok(ApiResponse.success(
                "All notifications deleted successfully.",
                HttpStatus.OK.value()
        ));
    }
}
