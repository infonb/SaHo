package com.saho.foundation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAcademicResponseDto {

    private Integer studentAcademicId;
    private Integer studentId;
    private Integer academicYearId;
    private String academicYearName;
    private Integer schoolId;
    private String schoolName;
    private Integer classId;
    private String className;
    private String rollNumber;
    private String admissionType;
    private String status;
    private String remarks;
    private Boolean isActive;
    private Boolean isDeleted;
    private LocalDateTime createdAt;
    private Integer createdBy;
    private LocalDateTime updatedAt;
    private Integer updatedBy;
}
