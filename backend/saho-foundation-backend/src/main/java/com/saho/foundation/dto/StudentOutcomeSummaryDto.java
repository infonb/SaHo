package com.saho.foundation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentOutcomeSummaryDto {

    private Integer studentAcademicId;
    private String outcome;
    private String status;
    private String admissionType;
    private Integer nextAcademicYearId;
    private String nextAcademicYearName;
    private Integer nextClassId;
    private String nextClassName;
    private String message;
}