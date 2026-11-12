package com.campusbazaar.service;

import com.campusbazaar.dto.UniversityDto;
import com.campusbazaar.mapper.UniversityMapper;
import com.campusbazaar.repository.UniversityRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UniversityService {

    private final UniversityRepository universityRepository;

    public UniversityService(UniversityRepository universityRepository) {
        this.universityRepository = universityRepository;
    }

    public List<UniversityDto> listActive() {
        return universityRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(UniversityMapper::toDto)
                .toList();
    }
}
