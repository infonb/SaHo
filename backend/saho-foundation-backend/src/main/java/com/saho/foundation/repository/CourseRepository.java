package com.saho.foundation.repository;

import com.saho.foundation.entity.CourseMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<CourseMaster, Integer>, JpaSpecificationExecutor<CourseMaster> {

    List<CourseMaster> findByIsDeletedFalse();

    Optional<CourseMaster> findByCourseNameIgnoreCase(String courseName);
}
