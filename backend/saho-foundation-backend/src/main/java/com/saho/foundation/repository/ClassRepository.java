package com.saho.foundation.repository;

import com.saho.foundation.entity.ClassMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassRepository extends JpaRepository<ClassMaster, Integer> {

    List<ClassMaster> findByIsDeletedFalseOrderByClassOrderAsc();

    List<ClassMaster> findByCourseIdAndIsDeletedFalseOrderByClassOrderAsc(Integer courseId);

    Optional<ClassMaster> findByClassNameIgnoreCase(String className);
}
