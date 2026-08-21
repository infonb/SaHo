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
public class StudentMarksRequestDto {

    private Integer studentId;
    private Integer studentAcademicId;
    private Integer createdBy;
    private List<StudentMarksEntryDto> marks;
}