package com.campusbazaar.mapper;

import com.campusbazaar.dto.ListingDto;
import com.campusbazaar.entity.Category;
import com.campusbazaar.entity.Listing;
import com.campusbazaar.entity.User;

public final class ListingMapper {
    private ListingMapper() {}

    public static ListingDto toDto(Listing listing) {
        Category cat = listing.getCategory();
        String icon = cat.getIcon();
        if ((icon == null || icon.isBlank()) && cat.getParent() != null) {
            icon = cat.getParent().getIcon();
        }
        User seller = listing.getSeller();
        return new ListingDto(
                listing.getId(),
                listing.getTitle(),
                listing.getDescription(),
                listing.getPrice(),
                listing.getCondition().name(),
                listing.getListingType().name(),
                listing.getStatus().name(),
                listing.getImageUrl(),
                new ListingDto.CategorySummary(
                        cat.getName(),
                        cat.getSlug(),
                        icon),
                new ListingDto.SellerSummary(
                        seller.getId(),
                        seller.getFullName(),
                        seller.isStudentVerified(),
                        seller.getUniversity() != null ? seller.getUniversity().getName() : null,
                        seller.getHostel()),
                listing.isDemo(),
                listing.isPopular(),
                listing.isStudentDeal(),
                listing.isHostelClearance(),
                listing.getCreatedAt());
    }
}
