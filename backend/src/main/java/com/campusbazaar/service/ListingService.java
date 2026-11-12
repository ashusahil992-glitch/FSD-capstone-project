package com.campusbazaar.service;

import com.campusbazaar.dto.CreateListingRequest;
import com.campusbazaar.dto.ListingDto;
import com.campusbazaar.dto.ListingSearchPageDto;
import com.campusbazaar.entity.Category;
import com.campusbazaar.entity.Listing;
import com.campusbazaar.entity.ListingCondition;
import com.campusbazaar.entity.ListingStatus;
import com.campusbazaar.entity.ListingType;
import com.campusbazaar.entity.User;
import com.campusbazaar.entity.UserStatus;
import com.campusbazaar.exception.BadRequestException;
import com.campusbazaar.exception.ResourceNotFoundException;
import com.campusbazaar.mapper.ListingMapper;
import com.campusbazaar.repository.CategoryRepository;
import com.campusbazaar.repository.ListingRepository;
import com.campusbazaar.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class ListingService {

    private final ListingRepository listingRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public ListingService(ListingRepository listingRepository, CategoryRepository categoryRepository,
                          UserRepository userRepository) {
        this.listingRepository = listingRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    public List<ListingDto> listAvailable() {
        return listingRepository.findByStatusOrderByCreatedAtDesc(ListingStatus.AVAILABLE)
                .stream()
                .map(ListingMapper::toDto)
                .toList();
    }

    public List<ListingDto> listMine(String sellerEmail) {
        User seller = userRepository.findByEmailIgnoreCase(sellerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found."));
        return listingRepository.findBySellerIdAndStatusNotOrderByCreatedAtDesc(seller.getId(), ListingStatus.REMOVED)
                .stream()
                .map(ListingMapper::toDto)
                .toList();
    }

    public ListingDto getAvailable(Long id) {
        return listingRepository.findByIdAndStatusNot(id, ListingStatus.REMOVED)
                .map(ListingMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found."));
    }

    public ListingSearchPageDto search(String query, String categorySlug, BigDecimal minPrice, BigDecimal maxPrice,
                                       ListingType listingType, ListingCondition condition, Long universityId,
                                       String sortBy, int page, int size) {
        if (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0) {
            throw new BadRequestException("Minimum price cannot be greater than maximum price.");
        }
        Comparator<Listing> byCreatedDesc = Comparator.comparing(
                Listing::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()));
        Comparator<Listing> comparator = switch (sortBy.toLowerCase(Locale.ROOT)) {
            case "newest" -> byCreatedDesc;
            case "popular" -> Comparator.comparing(Listing::isPopular).reversed().thenComparing(byCreatedDesc);
            case "price_asc" -> Comparator.comparing(Listing::getPrice, Comparator.nullsLast(Comparator.naturalOrder()))
                    .thenComparing(byCreatedDesc);
            case "price_desc" -> Comparator.comparing(Listing::getPrice, Comparator.nullsLast(Comparator.reverseOrder()))
                    .thenComparing(byCreatedDesc);
            default -> throw new BadRequestException("Sort must be newest, popular, price_asc, or price_desc.");
        };

        String normalizedQuery = (query != null && !query.isBlank()) ? query.trim().toLowerCase(Locale.ROOT) : null;
        String normalizedCategory = (categorySlug != null && !categorySlug.isBlank()) ? categorySlug.trim() : null;

        List<Listing> filtered = listingRepository.findByStatusOrderByCreatedAtDesc(ListingStatus.AVAILABLE)
                .stream()
                .filter(listing -> {
                    if (normalizedQuery != null) {
                        String title = listing.getTitle() != null ? listing.getTitle().toLowerCase(Locale.ROOT) : "";
                        String desc = listing.getDescription() != null ? listing.getDescription().toLowerCase(Locale.ROOT) : "";
                        String catName = (listing.getCategory() != null && listing.getCategory().getName() != null)
                                ? listing.getCategory().getName().toLowerCase(Locale.ROOT) : "";
                        String sellerName = (listing.getSeller() != null && listing.getSeller().getFullName() != null)
                                ? listing.getSeller().getFullName().toLowerCase(Locale.ROOT) : "";
                        if (!title.contains(normalizedQuery) && !desc.contains(normalizedQuery)
                                && !catName.contains(normalizedQuery) && !sellerName.contains(normalizedQuery)) {
                            return false;
                        }
                    }
                    if (normalizedCategory != null) {
                        Category cat = listing.getCategory();
                        if (cat == null) return false;
                        boolean matchesDirect = normalizedCategory.equalsIgnoreCase(cat.getSlug());
                        boolean matchesParent = cat.getParent() != null
                                && normalizedCategory.equalsIgnoreCase(cat.getParent().getSlug());
                        if (!matchesDirect && !matchesParent) return false;
                    }
                    if (minPrice != null && listing.getPrice().compareTo(minPrice) < 0) return false;
                    if (maxPrice != null && listing.getPrice().compareTo(maxPrice) > 0) return false;
                    if (listingType != null && listing.getListingType() != listingType) return false;
                    if (condition != null && listing.getCondition() != condition) return false;
                    if (universityId != null) {
                        User s = listing.getSeller();
                        if (s == null || s.getUniversity() == null || !universityId.equals(s.getUniversity().getId())) {
                            return false;
                        }
                    }
                    return true;
                })
                .sorted(comparator)
                .toList();

        long totalElements = filtered.size();
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        int fromIndex = Math.min(page * size, filtered.size());
        int toIndex = Math.min(fromIndex + size, filtered.size());
        List<ListingDto> pageItems = filtered.subList(fromIndex, toIndex)
                .stream()
                .map(ListingMapper::toDto)
                .toList();

        boolean isFirst = page == 0;
        boolean isLast = totalPages == 0 || page >= totalPages - 1;
        return new ListingSearchPageDto(pageItems, page, size, totalElements, totalPages, isFirst, isLast);
    }

    public ListingDto create(CreateListingRequest request, String sellerEmail) {
        User seller = userRepository.findByEmailIgnoreCase(sellerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found."));
        if (seller.getStatus() == UserStatus.SUSPENDED) {
            throw new BadRequestException("Suspended accounts cannot create listings.");
        }
        Category category = categoryRepository.findBySlugAndActiveTrue(request.categorySlug().trim())
                .orElseThrow(() -> new ResourceNotFoundException("The selected category is not available."));

        String imageUrl = (request.imageUrl() != null && !request.imageUrl().isBlank())
                ? request.imageUrl().trim() : null;
        Listing listing = new Listing(request.title().trim(), request.description().trim(),
                normalizedPrice(request), request.condition(), request.listingType(), imageUrl, category, seller);
        if (request.studentDeal() != null) listing.setStudentDeal(request.studentDeal());
        if (request.hostelClearance() != null) listing.setHostelClearance(request.hostelClearance());
        return ListingMapper.toDto(listingRepository.save(listing));
    }

    public ListingDto update(Long id, CreateListingRequest request, String sellerEmail) {
        Listing listing = findOwnedManageable(id, sellerEmail);
        Category category = categoryRepository.findBySlugAndActiveTrue(request.categorySlug().trim())
                .orElseThrow(() -> new ResourceNotFoundException("The selected category is not available."));
        listing.setTitle(request.title().trim());
        listing.setDescription(request.description().trim());
        listing.setPrice(normalizedPrice(request));
        listing.setCondition(request.condition());
        listing.setListingType(request.listingType());
        listing.setCategory(category);
        if (request.imageUrl() != null) {
            listing.setImageUrl(request.imageUrl().isBlank() ? null : request.imageUrl().trim());
        }
        if (request.studentDeal() != null) listing.setStudentDeal(request.studentDeal());
        if (request.hostelClearance() != null) listing.setHostelClearance(request.hostelClearance());
        return ListingMapper.toDto(listingRepository.save(listing));
    }

    public ListingDto updateStatus(Long id, ListingStatus newStatus, String sellerEmail) {
        if (newStatus != ListingStatus.AVAILABLE && newStatus != ListingStatus.SOLD) {
            throw new BadRequestException("Status must be AVAILABLE or SOLD.");
        }
        Listing listing = findOwnedManageable(id, sellerEmail);
        listing.setStatus(newStatus);
        return ListingMapper.toDto(listingRepository.save(listing));
    }

    public void delete(Long id, String sellerEmail) {
        Listing listing = findOwnedManageable(id, sellerEmail);
        listing.setStatus(ListingStatus.REMOVED);
        listingRepository.save(listing);
    }

    private Listing findOwnedManageable(Long id, String sellerEmail) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found."));
        if (!listing.getSeller().getEmail().equalsIgnoreCase(sellerEmail)) {
            throw new AccessDeniedException("You can only manage your own listings.");
        }
        if (listing.getStatus() == ListingStatus.REMOVED) {
            throw new BadRequestException("Removed listings cannot be changed.");
        }
        return listing;
    }

    private BigDecimal normalizedPrice(CreateListingRequest request) {
        BigDecimal price = request.price();
        if (request.listingType() == ListingType.GIVEAWAY || request.listingType() == ListingType.EXCHANGE) {
            return BigDecimal.ZERO;
        }
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("A price greater than zero is required for sale and rental listings.");
        }
        return price;
    }
}
