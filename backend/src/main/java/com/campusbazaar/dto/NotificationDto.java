package com.campusbazaar.dto;

import java.time.Instant;

public record NotificationDto(
        Long id,
        String message,
        Long conversationId,
        Long listingId,
        String listingTitle,
        Instant createdAt,
        Instant readAt
) {}
