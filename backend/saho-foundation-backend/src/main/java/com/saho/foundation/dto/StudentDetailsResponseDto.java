package com.saho.foundation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentDetailsResponseDto {

    private Integer studentId;
    private String studentName;
    private String gender;
    private LocalDate dob;
    private String className;
    private String schoolName;
    private String guardianName;
    private String phone;
    private String email;
    private String bloodGroup;
    private String religion;
    private String caste;
    private String orphanStatus;
    private String sponsor;
}
