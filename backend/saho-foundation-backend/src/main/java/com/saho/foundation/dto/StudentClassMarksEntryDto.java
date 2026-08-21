package com.saho.foundation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentClassMarksEntryDto {

    private Integer studentAcademicId;
    private String outcome;
    private List<StudentMarksEntryDto> marks;
}