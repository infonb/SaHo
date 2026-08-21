package com.saho.foundation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentSiblingSearchResponseDto {

    private Integer studentId;
    private String studentName;
    private Integer classId;
    private String className;
    private String schoolName;
}
