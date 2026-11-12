package com.campusbazaar.entity;

import org.springframework.data.annotation.Id;

import java.time.Instant;

public abstract class BaseEntity {

    @Id
    private Long id;

    private Instant createdAt;

    private Instant updatedAt;

    public void prepareForSave(Long assignedId) {
        Instant now = Instant.now();
        if (this.id == null) {
            this.id = assignedId;
        }
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        this.updatedAt = now;
    }

    public void syncForeignKeys() {
        // Subclasses override to keep scalar foreign key IDs synchronized with @DocumentReference fields.
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
