package com.saho.foundation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectMarksResponseDto {

    private Integer courseSubjectId;
    private Integer subjectId;
    private String subjectName;
    private String subjectCode;
    private BigDecimal marks;
    private String result;
}