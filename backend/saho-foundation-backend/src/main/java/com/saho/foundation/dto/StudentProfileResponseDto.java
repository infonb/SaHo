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
public class StudentProfileResponseDto {

    private Integer studentId;
    private String studentName;
    private String emailId;
    private LocalDate dob;
    private String gender;
    private String aadhaarNumber;
    private Integer casteId;
    private String casteName;
    private String religion;
    private String bloodGroup;
    private Integer classId;
    private String siblingId;
    private String orphanStatus;
    private String imageUrl;

    private String guardianName;
    private String guardianFirstName;
    private String guardianMiddleName;
    private String guardianLastName;
    private String phoneNumber;
    private String guardianRelationName;
    private String occ;
    private String addr;

    private String schName;
    private String schAddress;

    private String vilName;
    private String vilPincode;
    private String mndlName;
    private String distName;
    private String stName;
}
