package com.saho.foundation.repository;

import com.saho.foundation.entity.StudentSponsor;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.query.Procedure;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentSponsorRepository extends JpaRepository<StudentSponsor, Integer> {

    @Transactional
    @Procedure(procedureName = "assignsponsortostudent")
    void assignSponsorToStudent(
            @Param("p_std_id") Integer studentId,
            @Param("p_spn_id") Integer sponsorId,
            @Param("p_created_by") String createdBy
    );

    @Transactional
    @Procedure(procedureName = "removesponsorfromstudent")
    void removeSponsorFromStudent(
            @Param("p_std_id") Integer studentId
    );

    List<StudentSponsor> findByStudentIdAndIsActiveTrue(Integer studentId);

    List<StudentSponsor> findBySponsorIdAndIsActiveTrue(Integer sponsorId);

    List<StudentSponsor> findByIsActiveTrue();
}