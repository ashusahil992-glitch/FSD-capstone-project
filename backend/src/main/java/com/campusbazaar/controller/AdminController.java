package com.campusbazaar.controller;

import com.campusbazaar.dto.AdminDashboardDto;
import com.campusbazaar.dto.AdminListingDto;
import com.campusbazaar.dto.AdminReportDto;
import com.campusbazaar.dto.AdminUserDto;
import com.campusbazaar.dto.ApiResponse;
import com.campusbazaar.dto.ListingModerationRequest;
import com.campusbazaar.dto.ReportReviewRequest;
import com.campusbazaar.service.AdminService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/dashboard")
    public ApiResponse<AdminDashboardDto> dashboard() {
        return ApiResponse.ok(adminService.dashboard());
    }

    @GetMapping("/users")
    public ApiResponse<List<AdminUserDto>> users() {
        return ApiResponse.ok(adminService.users());
    }

    @PatchMapping("/users/{id}/verify-student")
    public ApiResponse<AdminUserDto> verifyStudent(@PathVariable Long id) {
        return ApiResponse.ok(adminService.verifyStudent(id));
    }

    @PatchMapping("/users/{id}/suspend")
    public ApiResponse<AdminUserDto> suspendUser(@PathVariable Long id) {
        return ApiResponse.ok(adminService.suspendUser(id));
    }

    @PatchMapping("/users/{id}/reinstate")
    public ApiResponse<AdminUserDto> reinstateUser(@PathVariable Long id) {
        return ApiResponse.ok(adminService.reinstateUser(id));
    }

    @GetMapping("/listings")
    public ApiResponse<List<AdminListingDto>> listings() {
        return ApiResponse.ok(adminService.listings());
    }

    @PatchMapping("/listings/{id}/moderation")
    public ApiResponse<AdminListingDto> moderateListing(
            @PathVariable Long id,
            @Valid @RequestBody ListingModerationRequest request) {
        return ApiResponse.ok(adminService.moderateListing(id, request));
    }

    @GetMapping("/reports")
    public ApiResponse<List<AdminReportDto>> reports() {
        return ApiResponse.ok(adminService.reports());
    }

    @PatchMapping("/reports/{id}")
    public ApiResponse<AdminReportDto> reviewReport(
            @PathVariable Long id,
            @Valid @RequestBody ReportReviewRequest request) {
        return ApiResponse.ok(adminService.reviewReport(id, request));
    }
}
