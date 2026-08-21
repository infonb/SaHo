package com.saho.foundation.repository;

import com.saho.foundation.entity.AcademicYear;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AcademicYearRepository extends JpaRepository<AcademicYear, Integer>, JpaSpecificationExecutor<AcademicYear> {

    List<AcademicYear> findByIsDeletedFalseOrderByStartDateDesc();

    Optional<AcademicYear> findByIsCurrentTrueAndIsActiveTrueAndIsDeletedFalse();

    Optional<AcademicYear> findByAcademicYearIdAndIsDeletedFalse(Integer academicYearId);

    Optional<AcademicYear> findByAcademicYearNameIgnoreCase(String academicYearName);

    Optional<AcademicYear> findFirstByIsDeletedFalseAndStartDateGreaterThanOrderByStartDateAsc(LocalDate startDate);
}
