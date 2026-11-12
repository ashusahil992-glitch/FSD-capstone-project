package com.campusbazaar.repository;

import com.campusbazaar.entity.Listing;
import com.campusbazaar.entity.ListingStatus;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ListingRepository extends MongoRepository<Listing, Long> {
    List<Listing> findByStatusOrderByCreatedAtDesc(ListingStatus status);
    List<Listing> findBySellerIdAndStatusNotOrderByCreatedAtDesc(Long sellerId, ListingStatus status);
    Optional<Listing> findByIdAndStatus(Long id, ListingStatus status);
    Optional<Listing> findByIdAndStatusNot(Long id, ListingStatus status);
    long countByStatus(ListingStatus status);
    List<Listing> findAllBy(Sort sort);
}
