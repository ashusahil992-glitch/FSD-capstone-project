package com.campusbazaar.dto;

import java.util.List;

public record NotificationListDto(List<NotificationDto> items, long unreadCount) {}
