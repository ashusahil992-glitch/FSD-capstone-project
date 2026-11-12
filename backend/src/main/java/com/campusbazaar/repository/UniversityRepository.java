package com.campusbazaar.repository;

import com.campusbazaar.entity.University;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface UniversityRepository extends MongoRepository<University, Long> {
    List<University> findByActiveTrueOrderByNameAsc();
    Optional<University> findByIdAndActiveTrue(Long id);
}
