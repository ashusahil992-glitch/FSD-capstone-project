package com.campusbazaar.repository;

import com.campusbazaar.entity.CampusPost;
import com.campusbazaar.entity.CampusPostStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CampusPostRepository extends MongoRepository<CampusPost, Long> {
    List<CampusPost> findByUniversityIdAndStatusNotOrderByCreatedAtDesc(Long universityId, CampusPostStatus status);
}
