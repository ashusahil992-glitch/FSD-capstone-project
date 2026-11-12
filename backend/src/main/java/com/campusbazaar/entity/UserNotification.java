package com.campusbazaar.entity;

import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;

import java.time.Instant;

@Document(collection = "user_notifications")
public class UserNotification extends BaseEntity {

    @DocumentReference(lazy = false)
    private User recipient;

    @Indexed
    private Long recipientId;

    @DocumentReference(lazy = false)
    private User actor;

    private Long actorId;

    @DocumentReference(lazy = false)
    private Conversation conversation;

    @Indexed
    private Long conversationId;

    private String message;

    private Instant readAt;

    protected UserNotification() {}

    public UserNotification(User recipient, User actor, Conversation conversation, String message) {
        this.recipient = recipient;
        this.recipientId = recipient != null ? recipient.getId() : null;
        this.actor = actor;
        this.actorId = actor != null ? actor.getId() : null;
        this.conversation = conversation;
        this.conversationId = conversation != null ? conversation.getId() : null;
        this.message = message;
    }

    @Override
    public void syncForeignKeys() {
        this.recipientId = recipient != null ? recipient.getId() : null;
        this.actorId = actor != null ? actor.getId() : null;
        this.conversationId = conversation != null ? conversation.getId() : null;
    }

    public User getRecipient() { return recipient; }
    public Long getRecipientId() { return recipientId; }
    public Conversation getConversation() { return conversation; }
    public Long getConversationId() { return conversationId; }
    public String getMessage() { return message; }
    public Instant getReadAt() { return readAt; }
    public void markRead() {
        if (readAt == null) readAt = Instant.now();
    }
}
