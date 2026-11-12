package com.campusbazaar.dto;

import com.campusbazaar.entity.ListingCondition;
import com.campusbazaar.entity.ListingType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateListingRequest(
        @NotBlank @Size(max = 140) String title,
        @NotBlank @Size(max = 2000) String description,
        @DecimalMin("0.00") @Digits(integer = 8, fraction = 2) BigDecimal price,
        @NotNull ListingCondition condition,
        @NotNull ListingType listingType,
        @NotBlank String categorySlug,
        @Size(max = 1500000) String imageUrl,
        Boolean studentDeal,
        Boolean hostelClearance
) {}
