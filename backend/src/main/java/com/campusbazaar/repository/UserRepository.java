package com.campusbazaar.repository;

import com.campusbazaar.entity.User;
import com.campusbazaar.entity.UserStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByUniversityIdAndStudentId(Long universityId, String studentId);
    List<User> findAllByOrderByCreatedAtDesc();
    long countByStatus(UserStatus status);
    long countByStudentVerifiedTrue();
}
