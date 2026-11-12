package com.campusbazaar.entity;

import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;

@Document(collection = "listing_reports")
public class ListingReport extends BaseEntity {

    @DocumentReference(lazy = false)
    private Listing listing;

    @Indexed
    private Long listingId;

    @DocumentReference(lazy = false)
    private User reporter;

    private Long reporterId;

    private String reason;

    @Indexed
    private ListingReportStatus status = ListingReportStatus.OPEN;

    protected ListingReport() {}

    public ListingReport(Listing listing, User reporter, String reason) {
        this.listing = listing;
        this.listingId = listing != null ? listing.getId() : null;
        this.reporter = reporter;
        this.reporterId = reporter != null ? reporter.getId() : null;
        this.reason = reason;
    }

    @Override
    public void syncForeignKeys() {
        this.listingId = listing != null ? listing.getId() : null;
        this.reporterId = reporter != null ? reporter.getId() : null;
    }

    public Listing getListing() { return listing; }
    public Long getListingId() { return listingId; }
    public User getReporter() { return reporter; }
    public Long getReporterId() { return reporterId; }
    public String getReason() { return reason; }
    public ListingReportStatus getStatus() { return status; }
    public void setStatus(ListingReportStatus status) { this.status = status; }
}
