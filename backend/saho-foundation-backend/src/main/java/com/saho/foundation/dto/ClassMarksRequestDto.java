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
public class ClassMarksRequestDto {

    private Integer academicYearId;
    private Integer schoolId;
    private Integer classId;
    private List<StudentClassMarksEntryDto> students;
}