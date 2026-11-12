package com.campusbazaar.service;

import com.campusbazaar.dto.CreateReportRequest;
import com.campusbazaar.entity.Listing;
import com.campusbazaar.entity.ListingReport;
import com.campusbazaar.entity.User;
import com.campusbazaar.exception.BadRequestException;
import com.campusbazaar.exception.ResourceNotFoundException;
import com.campusbazaar.repository.ListingReportRepository;
import com.campusbazaar.repository.ListingRepository;
import com.campusbazaar.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class ReportService {

    private final ListingReportRepository reportRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;

    public ReportService(ListingReportRepository reportRepository, ListingRepository listingRepository,
                        UserRepository userRepository) {
        this.reportRepository = reportRepository;
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
    }

    public void report(CreateReportRequest request, String email) {
        User reporter = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found."));
        Listing listing = listingRepository.findById(request.listingId())
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found."));
        if (listing.getSeller().getId().equals(reporter.getId())) {
            throw new BadRequestException("You cannot report your own listing.");
        }
        reportRepository.save(new ListingReport(listing, reporter, request.reason().trim()));
    }
}
