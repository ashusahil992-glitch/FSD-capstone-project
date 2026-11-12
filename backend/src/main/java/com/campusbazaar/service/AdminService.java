package com.campusbazaar.service;

import com.campusbazaar.dto.AdminDashboardDto;
import com.campusbazaar.dto.AdminListingDto;
import com.campusbazaar.dto.AdminReportDto;
import com.campusbazaar.dto.AdminUserDto;
import com.campusbazaar.dto.ListingModerationRequest;
import com.campusbazaar.dto.ReportReviewRequest;
import com.campusbazaar.entity.Listing;
import com.campusbazaar.entity.ListingReport;
import com.campusbazaar.entity.ListingReportStatus;
import com.campusbazaar.entity.ListingStatus;
import com.campusbazaar.entity.Role;
import com.campusbazaar.entity.User;
import com.campusbazaar.entity.UserStatus;
import com.campusbazaar.exception.BadRequestException;
import com.campusbazaar.exception.ResourceNotFoundException;
import com.campusbazaar.repository.ListingReportRepository;
import com.campusbazaar.repository.ListingRepository;
import com.campusbazaar.repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final ListingReportRepository reportRepository;

    public AdminService(UserRepository userRepository, ListingRepository listingRepository,
                        ListingReportRepository reportRepository) {
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.reportRepository = reportRepository;
    }

    public AdminDashboardDto dashboard() {
        return new AdminDashboardDto(
                userRepository.count(),
                userRepository.countByStatus(UserStatus.PENDING_STUDENT_VERIFICATION),
                userRepository.countByStudentVerifiedTrue(),
                userRepository.countByStatus(UserStatus.SUSPENDED),
                listingRepository.count(),
                listingRepository.countByStatus(ListingStatus.AVAILABLE),
                listingRepository.countByStatus(ListingStatus.REMOVED),
                reportRepository.countByStatus(ListingReportStatus.OPEN));
    }

    public List<AdminUserDto> users() {
        return userRepository.findAllByOrderByCreatedAtDesc().stream().map(AdminService::toDto).toList();
    }

    public AdminUserDto verifyStudent(Long id) {
        User user = findManageableUser(id);
        if (user.getRole() != Role.STUDENT) {
            throw new BadRequestException("Only student accounts can be student-verified.");
        }
        user.setStudentVerified(true);
        if (user.getStatus() != UserStatus.SUSPENDED) user.setStatus(UserStatus.VERIFIED);
        return toDto(userRepository.save(user));
    }

    public AdminUserDto suspendUser(Long id) {
        User user = findManageableUser(id);
        user.setStatus(UserStatus.SUSPENDED);
        return toDto(userRepository.save(user));
    }

    public AdminUserDto reinstateUser(Long id) {
        User user = findManageableUser(id);
        user.setStatus(user.isStudentVerified() ? UserStatus.VERIFIED : UserStatus.PENDING_STUDENT_VERIFICATION);
        return toDto(userRepository.save(user));
    }

    public List<AdminListingDto> listings() {
        return listingRepository.findAllBy(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream().map(AdminService::toDto).toList();
    }

    public AdminListingDto moderateListing(Long id, ListingModerationRequest request) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found."));
        if (listing.getStatus() == ListingStatus.SOLD && request.status() == ListingModerationRequest.ModerationStatus.AVAILABLE) {
            throw new BadRequestException("Sold listings cannot be restored to the marketplace.");
        }
        listing.setStatus(request.status() == ListingModerationRequest.ModerationStatus.REMOVED
                ? ListingStatus.REMOVED : ListingStatus.AVAILABLE);
        return toDto(listingRepository.save(listing));
    }

    public List<AdminReportDto> reports() {
        return reportRepository.findAllByOrderByCreatedAtDesc().stream().map(AdminService::toDto).toList();
    }

    public AdminReportDto reviewReport(Long id, ReportReviewRequest request) {
        if (request.status() == ListingReportStatus.OPEN) {
            throw new BadRequestException("A reviewed report must be marked reviewed or dismissed.");
        }
        ListingReport report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found."));
        report.setStatus(request.status());
        return toDto(reportRepository.save(report));
    }

    private User findManageableUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Admin accounts cannot be modified from this dashboard.");
        }
        return user;
    }

    private static AdminUserDto toDto(User user) {
        return new AdminUserDto(
                user.getId(), user.getFullName(), user.getEmail(), user.getMaskedStudentId(),
                user.getUniversity() == null ? null : user.getUniversity().getName(),
                user.getRole().name(), user.getStatus().name(), user.isEmailVerified(),
                user.isStudentVerified(), user.getCreatedAt());
    }

    private static AdminListingDto toDto(Listing listing) {
        return new AdminListingDto(
                listing.getId(), listing.getTitle(), listing.getPrice(), listing.getStatus().name(),
                listing.getCategory().getName(), listing.getSeller().getFullName(),
                listing.getSeller().getEmail(), listing.isDemo(), listing.getCreatedAt());
    }

    private static AdminReportDto toDto(ListingReport report) {
        return new AdminReportDto(
                report.getId(), report.getListing().getId(), report.getListing().getTitle(),
                report.getReporter().getFullName(), report.getReporter().getEmail(), report.getReason(),
                report.getStatus().name(), report.getCreatedAt());
    }
}
