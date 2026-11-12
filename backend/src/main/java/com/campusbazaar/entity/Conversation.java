package com.campusbazaar.entity;

import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;

import java.time.Instant;

@Document(collection = "conversations")
@CompoundIndex(name = "uk_conversation_listing_buyer", def = "{'listingId': 1, 'buyerId': 1}", unique = true)
public class Conversation extends BaseEntity {

    @DocumentReference(lazy = false)
    private Listing listing;

    @Indexed
    private Long listingId;

    @DocumentReference(lazy = false)
    private User buyer;

    @Indexed
    private Long buyerId;

    @DocumentReference(lazy = false)
    private User seller;

    @Indexed
    private Long sellerId;

    private Instant lastMessageAt;

    protected Conversation() {}

    public Conversation(Listing listing, User buyer, User seller) {
        this.listing = listing;
        this.listingId = listing != null ? listing.getId() : null;
        this.buyer = buyer;
        this.buyerId = buyer != null ? buyer.getId() : null;
        this.seller = seller;
        this.sellerId = seller != null ? seller.getId() : null;
        this.lastMessageAt = Instant.now();
    }

    @Override
    public void syncForeignKeys() {
        this.listingId = listing != null ? listing.getId() : null;
        this.buyerId = buyer != null ? buyer.getId() : null;
        this.sellerId = seller != null ? seller.getId() : null;
    }

    public Listing getListing() { return listing; }
    public Long getListingId() { return listingId; }
    public User getBuyer() { return buyer; }
    public Long getBuyerId() { return buyerId; }
    public User getSeller() { return seller; }
    public Long getSellerId() { return sellerId; }
    public Instant getLastMessageAt() { return lastMessageAt; }
    public void touch() { this.lastMessageAt = Instant.now(); }
    public boolean hasParticipant(Long userId) {
        return buyer.getId().equals(userId) || seller.getId().equals(userId);
    }
    public User otherParticipant(Long userId) {
        return buyer.getId().equals(userId) ? seller : buyer;
    }
}
