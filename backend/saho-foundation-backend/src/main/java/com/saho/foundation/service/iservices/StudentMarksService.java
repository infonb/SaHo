package com.saho.foundation.service.iservices;

import com.saho.foundation.dto.ClassMarksRequestDto;
import com.saho.foundation.dto.ClassMarksSheetResponseDto;
import com.saho.foundation.dto.ClassStudentResponseDto;
import com.saho.foundation.dto.StudentMarksRequestDto;
import com.saho.foundation.dto.StudentMarksResponseDto;

import java.util.List;

public interface StudentMarksService {

    StudentMarksResponseDto getMarksByStudentAcademicId(Integer studentAcademicId);

    StudentMarksResponseDto saveAnnualMarks(StudentMarksRequestDto request);

    List<ClassStudentResponseDto> getClassStudents(Integer academicYearId, Integer schoolId, Integer classId);

    ClassMarksSheetResponseDto getClassMarksSheet(Integer academicYearId, Integer schoolId, Integer classId);

    ClassMarksSheetResponseDto saveClassAnnualMarks(ClassMarksRequestDto request);
}