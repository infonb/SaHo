package com.saho.foundation.repository;

import com.saho.foundation.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.query.Procedure;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Integer>, StudentProcedureRepository {

    boolean existsByEmailId(String emailId);

    boolean existsByAadhaarNumber(String aadhaarNumber);

    boolean existsByEmailIdAndStudentIdNot(String emailId, Integer studentId);

    boolean existsByAadhaarNumberAndStudentIdNot(String aadhaarNumber, Integer studentId);

    Optional<Student> findByAadhaarNumber(String aadhaarNumber);

    Optional<Student> findByAadhaarNumberAndIsDeletedFalse(String aadhaarNumber);

    List<Student> findByStudentIdInAndIsDeletedFalse(Collection<Integer> studentIds);

    boolean existsByAadhaarNumberAndIsDeletedFalse(String aadhaarNumber);

    boolean existsByEmailIdAndIsDeletedFalse(String emailId);

    @Procedure(procedureName = "createorupdatestudent_v2")
    void createOrUpdateStudentV2(
            @Param("p_student_id") Integer studentId,
            @Param("p_first_name") String firstName,
            @Param("p_last_name") String lastName,
            @Param("p_email_id") String emailId,
            @Param("p_dob") java.time.LocalDate dob,
            @Param("p_gender") String gender,
            @Param("p_aadhaar_number") String aadhaarNumber,
            @Param("p_caste_id") Integer casteId,
            @Param("p_religion") String religion,
            @Param("p_blood_group") String bloodGroup,
            @Param("p_family_id") Integer familyId,
            @Param("p_guardian_id") Integer guardianId,
            @Param("p_sibling_id") String siblingId,
            @Param("p_orphan_status") String orphanStatus,
            @Param("p_image_url") String imageUrl,
            @Param("p_created_by") Integer createdBy
    );

    @Procedure(procedureName = "deletestudent")
    void deleteStudent(
            @Param("p_student_ids") Integer[] studentIds,
            @Param("p_modified_by") Integer modifiedBy
    );
}
