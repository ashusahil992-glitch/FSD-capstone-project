package com.campusbazaar.repository;

import com.campusbazaar.entity.UserNotification;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface UserNotificationRepository extends MongoRepository<UserNotification, Long> {
    List<UserNotification> findTop50ByRecipientIdOrderByCreatedAtDesc(Long recipientId);
    long countByRecipientIdAndReadAtIsNull(Long recipientId);
    Optional<UserNotification> findByIdAndRecipientId(Long id, Long recipientId);
    List<UserNotification> findByRecipientIdAndReadAtIsNull(Long recipientId);
    List<UserNotification> findByConversationIdAndRecipientIdAndReadAtIsNull(Long conversationId, Long recipientId);
    List<UserNotification> findByRecipientIdAndReadAtIsNullAndConversationId(Long recipientId, Long conversationId);
}
