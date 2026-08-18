package com.saho.foundation.repository;

import com.saho.foundation.entity.CourseMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<CourseMaster, Integer> {

    List<CourseMaster> findByIsDeletedFalse();
}
