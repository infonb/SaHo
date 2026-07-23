package com.saho.foundation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAcademicRequestDto {

    private Integer studentAcademicId;
    private Integer academicYearId;
    private Integer schoolId;
    private Integer classId;
    private String rollNumber;
    private String admissionType;
    private String status;
    private String remarks;
    private Boolean isActive;
    private Boolean isDeleted;
    private Integer createdBy;
    private Integer updatedBy;
}
