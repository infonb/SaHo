package com.saho.foundation.repository;

import com.saho.foundation.dto.StudentListResponseDto;
import com.saho.foundation.dto.StudentProfileResponseDto;
import com.saho.foundation.entity.StudentAcademic;

import java.util.List;
import java.util.Optional;

public interface StudentProcedureRepository {

    List<StudentListResponseDto> getAllStudentsWithPagination(
            String search,
            Integer pageNumber,
            Integer pageSize,
            String gender,
            String classId,
            String orphanStatus,
            String stId,
            String distId,
            String mndlId,
            String vilId,
            String schId,
            String academicYearId,
            String parentType,
            String parentOccupation,
            String sortColumn,
            String sortDirection
    );

    Optional<StudentProfileResponseDto> getStudentProfileById(Integer studentId);

    Optional<StudentAcademic> getStudentAcademicById(Integer studentId);
}
