package com.saho.foundation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentMarksResponseDto {

    private Integer studentAcademicId;
    private Integer studentId;
    private String studentName;
    private Integer academicYearId;
    private String academicYearName;
    private Integer courseId;
    private Integer classId;
    private String className;
    private Integer schoolId;
    private String schoolName;
    private String rollNumber;
    private BigDecimal totalMarks;
    private BigDecimal maxTotal;
    private BigDecimal percentage;
    private String overallResult;
    private List<SubjectMarksResponseDto> subjects;
}