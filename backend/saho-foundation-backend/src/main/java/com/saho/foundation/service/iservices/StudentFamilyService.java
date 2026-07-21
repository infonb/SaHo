package com.saho.foundation.service.iservices;

import com.saho.foundation.entity.StudentFamily;

public interface StudentFamilyService {

    StudentFamily createOrUpdateStudentFamily(
            Integer familyId,
            String fatherName,
            String fatherOccupation,
            String fatherStatus,
            String motherName,
            String motherOccupation,
            String motherStatus,
            Integer createdBy
    );

    StudentFamily getStudentFamilyById(Integer familyId);
}
