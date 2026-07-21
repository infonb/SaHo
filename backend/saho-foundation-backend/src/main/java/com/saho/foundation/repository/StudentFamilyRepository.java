package com.saho.foundation.repository;

import com.saho.foundation.entity.StudentFamily;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.query.Procedure;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentFamilyRepository extends JpaRepository<StudentFamily, Integer> {

    @Procedure(procedureName = "createorupdatestudentfamily")
    void createOrUpdateStudentFamily(
            @Param("p_family_id") Integer familyId,
            @Param("p_father_name") String fatherName,
            @Param("p_father_occupation") String fatherOccupation,
            @Param("p_father_status") String fatherStatus,
            @Param("p_mother_name") String motherName,
            @Param("p_mother_occupation") String motherOccupation,
            @Param("p_mother_status") String motherStatus,
            @Param("p_created_by") Integer createdBy
    );

    Optional<StudentFamily> findByFamilyIdAndIsDeletedFalse(Integer familyId);

    Optional<StudentFamily> findTopByFatherNameAndMotherNameAndFatherOccupationAndMotherOccupationAndFatherStatusAndMotherStatusOrderByFamilyIdDesc(
            String fatherName,
            String motherName,
            String fatherOccupation,
            String motherOccupation,
            String fatherStatus,
            String motherStatus
    );
}
