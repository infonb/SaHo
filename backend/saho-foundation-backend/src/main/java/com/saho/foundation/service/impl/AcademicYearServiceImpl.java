package com.saho.foundation.service.impl;

import com.saho.foundation.dto.AcademicYearDto;
import com.saho.foundation.entity.AcademicYear;
import com.saho.foundation.exception.ResourceNotFoundException;
import com.saho.foundation.repository.AcademicYearRepository;
import com.saho.foundation.service.iservices.IAcademicYearService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AcademicYearServiceImpl implements IAcademicYearService {

    private final AcademicYearRepository academicYearRepository;

    @Override
    public List<AcademicYearDto> getAllAcademicYears() {
        return academicYearRepository.findByIsDeletedFalseOrderByStartDateDesc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public AcademicYearDto getCurrentAcademicYear() {
        AcademicYear academicYear = academicYearRepository.findByIsCurrentTrueAndIsActiveTrueAndIsDeletedFalse()
                .orElseThrow(() -> new ResourceNotFoundException("Current academic year not found"));
        return toDto(academicYear);
    }

    private AcademicYearDto toDto(AcademicYear academicYear) {
        return AcademicYearDto.builder()
                .academicYearId(academicYear.getAcademicYearId())
                .academicYearName(academicYear.getAcademicYearName())
                .startDate(academicYear.getStartDate())
                .endDate(academicYear.getEndDate())
                .isCurrent(academicYear.getIsCurrent())
                .isActive(academicYear.getIsActive())
                .isDeleted(academicYear.getIsDeleted())
                .createdAt(academicYear.getCreatedAt())
                .updatedAt(academicYear.getUpdatedAt())
                .build();
    }
}
