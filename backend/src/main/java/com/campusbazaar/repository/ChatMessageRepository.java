package com.campusbazaar.repository;

import com.campusbazaar.entity.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ChatMessageRepository extends MongoRepository<ChatMessage, Long> {
    List<ChatMessage> findByConversationIdOrderByCreatedAtAsc(Long conversationId);
    Optional<ChatMessage> findTopByConversationIdOrderByCreatedAtDesc(Long conversationId);
}
