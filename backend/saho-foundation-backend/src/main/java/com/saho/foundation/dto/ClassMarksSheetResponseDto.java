package com.saho.foundation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassMarksSheetResponseDto {

    private Integer academicYearId;
    private String academicYearName;
    private Integer schoolId;
    private String schoolName;
    private Integer classId;
    private String className;
    private List<CourseSubjectMarksDto> subjects;
    private List<ClassStudentResponseDto> students;
    private Map<Integer, Map<Integer, SubjectMarksResponseDto>> existingMarks;
    private Map<Integer, StudentOutcomeSummaryDto> outcomes;
}