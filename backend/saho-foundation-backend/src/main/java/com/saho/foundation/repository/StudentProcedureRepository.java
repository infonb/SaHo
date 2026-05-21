package com.saho.foundation.repository;

import com.saho.foundation.dto.StudentListResponseDto;
import com.saho.foundation.dto.StudentProfileResponseDto;

import java.util.List;
import java.util.Optional;

public interface StudentProcedureRepository {

    List<StudentListResponseDto> getAllStudentsWithPagination(Integer pageNumber, Integer pageSize);

    Optional<StudentProfileResponseDto> getStudentProfileById(Integer studentId);
}
