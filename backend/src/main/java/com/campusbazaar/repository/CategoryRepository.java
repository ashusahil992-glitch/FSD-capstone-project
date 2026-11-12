package com.campusbazaar.repository;

import com.campusbazaar.entity.Category;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends MongoRepository<Category, Long> {
    Optional<Category> findBySlug(String slug);
    Optional<Category> findBySlugAndActiveTrue(String slug);
    List<Category> findByActiveTrueOrderByNameAsc();
}
