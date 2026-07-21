package com.saho.foundation.repository;

import com.saho.foundation.entity.AcademicYear;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AcademicYearRepository extends JpaRepository<AcademicYear, Integer> {

    List<AcademicYear> findByIsDeletedFalseOrderByStartDateDesc();

    Optional<AcademicYear> findByIsCurrentTrueAndIsActiveTrueAndIsDeletedFalse();

    Optional<AcademicYear> findByAcademicYearIdAndIsDeletedFalse(Integer academicYearId);
}
