package com.saho.foundation.dto.imports;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentImportRow {
    private int rowNumber;
    private String firstName;
    private String lastName;
    private String email;
    private String dob;
    private String gender;
    private String aadhaar;
    private String religion;
    private String bloodGroup;
    private String caste;
    private String orphanStatus;
    private String state;
    private String district;
    private String mandal;
    private String village;
    private String school;
    private String className;
    private String guardianFirstName;
    private String guardianLastName;
    private String guardianPhone;
    private String relationship;
    private String occupation;
    private String address;
    private String rollNumber;
    private String admissionType;
    private String status;
    private String remarks;
    private String fatherName;
    private String fatherOccupation;
    private String fatherStatus;
    private String motherName;
    private String motherOccupation;
    private String motherStatus;
}
