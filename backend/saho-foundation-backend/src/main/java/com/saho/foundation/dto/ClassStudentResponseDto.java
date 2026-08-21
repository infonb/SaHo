package com.saho.foundation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassStudentResponseDto {

    private Integer studentAcademicId;
    private Integer studentId;
    private String rollNumber;
    private String studentName;
    private String status;
}