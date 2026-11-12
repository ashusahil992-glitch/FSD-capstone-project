package com.campusbazaar.entity;

import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;

@Document(collection = "chat_messages")
public class ChatMessage extends BaseEntity {

    @DocumentReference(lazy = false)
    private Conversation conversation;

    @Indexed
    private Long conversationId;

    @DocumentReference(lazy = false)
    private User sender;

    @Indexed
    private Long senderId;

    private String content;

    protected ChatMessage() {}

    public ChatMessage(Conversation conversation, User sender, String content) {
        this.conversation = conversation;
        this.conversationId = conversation != null ? conversation.getId() : null;
        this.sender = sender;
        this.senderId = sender != null ? sender.getId() : null;
        this.content = content;
    }

    @Override
    public void syncForeignKeys() {
        this.conversationId = conversation != null ? conversation.getId() : null;
        this.senderId = sender != null ? sender.getId() : null;
    }

    public Conversation getConversation() { return conversation; }
    public Long getConversationId() { return conversationId; }
    public User getSender() { return sender; }
    public Long getSenderId() { return senderId; }
    public String getContent() { return content; }
}
