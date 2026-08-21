package com.saho.foundation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseSubjectMarksDto {

    private Integer courseSubjectId;
    private Integer courseId;
    private Integer classId;
    private Integer subjectId;
    private String subjectName;
    private String subjectCode;
}