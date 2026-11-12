package com.campusbazaar.repository;

import com.campusbazaar.entity.ListingReport;
import com.campusbazaar.entity.ListingReportStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ListingReportRepository extends MongoRepository<ListingReport, Long> {
    List<ListingReport> findAllByOrderByCreatedAtDesc();
    long countByStatus(ListingReportStatus status);
}
