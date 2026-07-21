package com.saho.foundation.controller;

import com.saho.foundation.dto.StudentFamilyDto;
import com.saho.foundation.entity.StudentFamily;
import com.saho.foundation.service.iservices.StudentFamilyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student-families")
@RequiredArgsConstructor
public class StudentFamilyController {

    private final StudentFamilyService studentFamilyService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StudentFamilyDto createStudentFamily(@RequestBody StudentFamilyDto dto) {
        return toDto(studentFamilyService.createOrUpdateStudentFamily(
                null,
                dto.getFatherName(),
                dto.getFatherOccupation(),
                dto.getFatherStatus(),
                dto.getMotherName(),
                dto.getMotherOccupation(),
                dto.getMotherStatus(),
                dto.getCreatedBy()
        ));
    }

    @PutMapping("/{familyId}")
    public StudentFamilyDto updateStudentFamily(@PathVariable Integer familyId, @RequestBody StudentFamilyDto dto) {
        return toDto(studentFamilyService.createOrUpdateStudentFamily(
                familyId,
                dto.getFatherName(),
                dto.getFatherOccupation(),
                dto.getFatherStatus(),
                dto.getMotherName(),
                dto.getMotherOccupation(),
                dto.getMotherStatus(),
                dto.getCreatedBy()
        ));
    }

    @GetMapping("/{familyId}")
    public StudentFamilyDto getStudentFamily(@PathVariable Integer familyId) {
        return toDto(studentFamilyService.getStudentFamilyById(familyId));
    }

    private StudentFamilyDto toDto(StudentFamily family) {
        return StudentFamilyDto.builder()
                .familyId(family.getFamilyId())
                .fatherName(family.getFatherName())
                .fatherOccupation(family.getFatherOccupation())
                .fatherStatus(family.getFatherStatus())
                .motherName(family.getMotherName())
                .motherOccupation(family.getMotherOccupation())
                .motherStatus(family.getMotherStatus())
                .isDeleted(family.getIsDeleted())
                .createdAt(family.getCreatedAt())
                .createdBy(family.getCreatedBy())
                .modifiedAt(family.getModifiedAt())
                .modifiedBy(family.getModifiedBy())
                .build();
    }
}
