package com.saho.foundation.repository;

import com.saho.foundation.entity.StudentAcademic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.query.Procedure;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentAcademicRepository extends JpaRepository<StudentAcademic, Integer> {

    @Procedure(procedureName = "createorupdatestudentacademic")
    void createOrUpdateStudentAcademic(
            @Param("p_student_academic_id") Integer studentAcademicId,
            @Param("p_student_id") Integer studentId,
            @Param("p_academic_year_id") Integer academicYearId,
            @Param("p_school_id") Integer schoolId,
            @Param("p_class_id") Integer classId,
            @Param("p_roll_number") String rollNumber,
            @Param("p_admission_type") String admissionType,
            @Param("p_status") String status,
            @Param("p_remarks") String remarks,
            @Param("p_is_active") Boolean isActive,
            @Param("p_created_by") Integer createdBy
    );

    Optional<StudentAcademic> findByStudentAcademicIdAndIsDeletedFalse(Integer studentAcademicId);

    Optional<StudentAcademic> findTopByStudentIdAndIsDeletedFalseOrderByStudentAcademicIdDesc(Integer studentId);
}
