package com.campusbazaar.controller;

import com.campusbazaar.dto.ApiResponse;
import com.campusbazaar.dto.NotificationListDto;
import com.campusbazaar.service.NotificationService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ApiResponse<NotificationListDto> list(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(notificationService.list(jwt.getSubject()));
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<NotificationListDto> markRead(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(notificationService.markRead(id, jwt.getSubject()));
    }

    @PatchMapping("/read-all")
    public ApiResponse<NotificationListDto> markAllRead(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(notificationService.markAllRead(jwt.getSubject()));
    }
}
