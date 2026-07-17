package com.saho.foundation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentSiblingInfoDto {
    private Integer studentId;
    private String fullName;
    private Integer classId;
    private String className;
    private String schoolName;
}
