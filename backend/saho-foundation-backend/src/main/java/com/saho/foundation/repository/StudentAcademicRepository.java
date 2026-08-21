package com.saho.foundation.repository;

import com.saho.foundation.dto.ClassStudentDto;
import com.saho.foundation.entity.StudentAcademic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.query.Procedure;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
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

    @Query("""
            SELECT new com.saho.foundation.dto.ClassStudentDto(
                sa.studentAcademicId, sa.studentId, sa.rollNumber, s.firstName, s.lastName, sa.status)
            FROM StudentAcademic sa, Student s
            WHERE s.studentId = sa.studentId
              AND sa.academicYearId = :academicYearId
              AND sa.schoolId = :schoolId
              AND sa.classId = :classId
              AND sa.isDeleted = false
              AND s.isDeleted = false
            ORDER BY sa.rollNumber
            """)
    List<ClassStudentDto> findClassRoster(
            @Param("academicYearId") Integer academicYearId,
            @Param("schoolId") Integer schoolId,
            @Param("classId") Integer classId);
}
