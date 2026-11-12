package com.campusbazaar.controller;

import com.campusbazaar.dto.ApiResponse;
import com.campusbazaar.dto.CreateListingRequest;
import com.campusbazaar.dto.ListingDto;
import com.campusbazaar.dto.ListingSearchPageDto;
import com.campusbazaar.entity.ListingCondition;
import com.campusbazaar.entity.ListingStatus;
import com.campusbazaar.entity.ListingType;
import com.campusbazaar.service.ListingService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.math.BigDecimal;
import java.util.List;

@RestController
@Validated
@RequestMapping("/api/listings")
public class ListingController {

    private final ListingService listingService;

    public ListingController(ListingService listingService) {
        this.listingService = listingService;
    }

    @GetMapping
    public ApiResponse<List<ListingDto>> list() {
        return ApiResponse.ok(listingService.listAvailable());
    }

    @GetMapping("/mine")
    public ApiResponse<List<ListingDto>> mine(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(listingService.listMine(jwt.getSubject()));
    }

    @GetMapping("/search")
    public ApiResponse<ListingSearchPageDto> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) ListingType listingType,
            @RequestParam(required = false) ListingCondition condition,
            @RequestParam(required = false) Long universityId,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "12") @Min(1) @Max(50) int size) {
        return ApiResponse.ok(listingService.search(
                q, category, minPrice, maxPrice, listingType, condition, universityId, sort, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<ListingDto> get(@PathVariable Long id) {
        return ApiResponse.ok(listingService.getAvailable(id));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ListingDto>> create(
            @Valid @RequestBody CreateListingRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        ListingDto listing = listingService.create(request, jwt.getSubject());
        var location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(listing.id())
                .toUri();
        return ResponseEntity.created(location)
                .body(ApiResponse.ok("Listing saved successfully.", listing));
    }

    @PutMapping("/{id}")
    public ApiResponse<ListingDto> update(
            @PathVariable Long id,
            @Valid @RequestBody CreateListingRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok("Listing updated successfully.", listingService.update(id, request, jwt.getSubject()));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<ListingDto> updateStatus(
            @PathVariable Long id,
            @RequestParam ListingStatus status,
            @AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok("Listing status updated.", listingService.updateStatus(id, status, jwt.getSubject()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        listingService.delete(id, jwt.getSubject());
        return ResponseEntity.noContent().build();
    }
}
