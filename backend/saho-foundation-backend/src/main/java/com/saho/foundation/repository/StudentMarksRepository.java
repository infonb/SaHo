package com.saho.foundation.repository;

import com.saho.foundation.entity.StudentMarks;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentMarksRepository extends JpaRepository<StudentMarks, Integer> {

    List<StudentMarks> findByStudentAcademicIdAndIsDeletedFalse(Integer studentAcademicId);

    List<StudentMarks> findByStudentAcademicIdInAndIsDeletedFalse(java.util.Collection<Integer> studentAcademicIds);

    Optional<StudentMarks> findByStudentAcademicIdAndCourseSubjectIdAndIsDeletedFalse(
            Integer studentAcademicId, Integer courseSubjectId);

    boolean existsByStudentAcademicIdAndCourseSubjectIdAndIsDeletedFalse(
            Integer studentAcademicId, Integer courseSubjectId);
}