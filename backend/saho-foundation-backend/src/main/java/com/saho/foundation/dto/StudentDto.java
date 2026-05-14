package com.saho.foundation.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class StudentDto {

    private String firstName;

    private String middleName;

    private String lastName;

    private String emailId;

    private LocalDate dob;

    private String gender;

    private String aadhaarNumber;

    private String caste;

    private String religion;

    private String bloodGroup;

    private Integer schId;

    private Integer classId;

    private Integer guardianId;

    private String orphanStatus;

    private String imageUrl;

    private Boolean isActive;

    private String createdBy;
}