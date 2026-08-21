package com.saho.foundation.repository;

import com.saho.foundation.entity.CourseSubject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseSubjectRepository extends JpaRepository<CourseSubject, Integer>, JpaSpecificationExecutor<CourseSubject> {

    Optional<CourseSubject> findByCourseIdAndClassIdAndSubjectIdAndIsDeletedFalse(
            Integer courseId, Integer classId, Integer subjectId);

    List<CourseSubject> findByCourseIdAndClassIdAndIsDeletedFalseOrderByCourseSubjectIdAsc(
            Integer courseId, Integer classId);

    List<CourseSubject> findByClassIdAndIsDeletedFalseOrderByCourseSubjectIdAsc(Integer classId);
}