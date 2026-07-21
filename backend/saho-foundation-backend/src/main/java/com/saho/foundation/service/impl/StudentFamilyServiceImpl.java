package com.saho.foundation.service.impl;

import com.saho.foundation.entity.StudentFamily;
import com.saho.foundation.exception.ResourceNotFoundException;
import com.saho.foundation.repository.StudentFamilyRepository;
import com.saho.foundation.service.iservices.StudentFamilyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StudentFamilyServiceImpl implements StudentFamilyService {

    private final StudentFamilyRepository studentFamilyRepository;

    @Override
    @Transactional
    public StudentFamily createOrUpdateStudentFamily(
            Integer familyId,
            String fatherName,
            String fatherOccupation,
            String fatherStatus,
            String motherName,
            String motherOccupation,
            String motherStatus,
            Integer createdBy
    ) {
        studentFamilyRepository.createOrUpdateStudentFamily(
                familyId,
                fatherName,
                fatherOccupation,
                fatherStatus,
                motherName,
                motherOccupation,
                motherStatus,
                createdBy
        );

        if (familyId != null) {
            return getStudentFamilyById(familyId);
        }

        return studentFamilyRepository
                .findTopByFatherNameAndMotherNameAndFatherOccupationAndMotherOccupationAndFatherStatusAndMotherStatusOrderByFamilyIdDesc(
                        fatherName,
                        motherName,
                        fatherOccupation,
                        motherOccupation,
                        fatherStatus,
                        motherStatus
                )
                .orElseThrow(() -> new ResourceNotFoundException("Student family not found after procedure call"));
    }

    @Override
    @Transactional(readOnly = true)
    public StudentFamily getStudentFamilyById(Integer familyId) {
        return studentFamilyRepository.findByFamilyIdAndIsDeletedFalse(familyId)
                .orElseThrow(() -> new ResourceNotFoundException("Student family not found with id: " + familyId));
    }
}
