package com.campusbazaar.repository;

import com.campusbazaar.entity.Conversation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends MongoRepository<Conversation, Long> {
    List<Conversation> findByBuyerIdOrSellerIdOrderByUpdatedAtDesc(Long buyerId, Long sellerId);

    @Query("{ '_id': ?0, '$or': [ { 'buyerId': ?1 }, { 'sellerId': ?1 } ] }")
    Optional<Conversation> findParticipantConversation(Long id, Long userId);

    Optional<Conversation> findByListingIdAndBuyerId(Long listingId, Long buyerId);
}
