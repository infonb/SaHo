package com.saho.foundation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassStudentDto {

    private Integer studentAcademicId;
    private Integer studentId;
    private String rollNumber;
    private String firstName;
    private String lastName;
    private String status;

    public String getStudentName() {
        return (firstName != null ? firstName : "")
                + (lastName != null && !lastName.isBlank() ? " " + lastName : "");
    }
}