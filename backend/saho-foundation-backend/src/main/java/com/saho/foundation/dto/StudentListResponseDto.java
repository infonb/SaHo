package com.saho.foundation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentListResponseDto {

    private Integer studentId;
    private String name;
    private String emailId;
    private LocalDate dob;
    private String gender;
    private String aadhaarNumber;
    private Integer casteId;
    private String religion;
    private String bloodGroup;
    private Integer schId;
    private Integer classId;
    private Integer guardianId;
    private String siblingId;
    private String orphanStatus;
    private String imageUrl;
    private LocalDateTime createdAt;
    private Integer createdBy;
    private LocalDateTime modifiedAt;
    private Integer modifiedBy;
}
