package com.campusbazaar.service;

import com.campusbazaar.dto.NotificationDto;
import com.campusbazaar.dto.NotificationListDto;
import com.campusbazaar.entity.User;
import com.campusbazaar.entity.UserNotification;
import com.campusbazaar.exception.ResourceNotFoundException;
import com.campusbazaar.repository.UserNotificationRepository;
import com.campusbazaar.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private final UserNotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(UserNotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public NotificationListDto list(String email) {
        User user = findUser(email);
        List<NotificationDto> items = notificationRepository.findTop50ByRecipientIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(NotificationService::toDto)
                .toList();
        return new NotificationListDto(items,
                notificationRepository.countByRecipientIdAndReadAtIsNull(user.getId()));
    }

    public NotificationListDto markRead(Long id, String email) {
        User user = findUser(email);
        UserNotification notification = notificationRepository.findByIdAndRecipientId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found."));
        notification.markRead();
        notificationRepository.save(notification);
        return list(email);
    }

    public NotificationListDto markAllRead(String email) {
        User user = findUser(email);
        List<UserNotification> unread = notificationRepository.findByRecipientIdAndReadAtIsNull(user.getId());
        if (!unread.isEmpty()) {
            unread.forEach(UserNotification::markRead);
            notificationRepository.saveAll(unread);
        }
        return list(email);
    }

    private User findUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found."));
    }

    private static NotificationDto toDto(UserNotification notification) {
        return new NotificationDto(
                notification.getId(),
                notification.getMessage(),
                notification.getConversation().getId(),
                notification.getConversation().getListing().getId(),
                notification.getConversation().getListing().getTitle(),
                notification.getCreatedAt(),
                notification.getReadAt());
    }
}
