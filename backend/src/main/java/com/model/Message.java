package com.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Message payload exchanged between administrators and officers.
 * Maps directly to documents in the Firestore 'messages' collection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {
    private String id;
    private String chatRoomId;
    private String senderId;
    private String senderName;
    private String text;
    private Long timestamp;
}
