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
    private Integer studentAcademicId;
    private Integer schoolId;
    private String schoolName;
    private Integer courseId;
    private Integer classId;
    private String className;
    private Integer academicYearId;
    private String academicYearName;
    private String rollNumber;
    private String admissionType;
    private String status;
    private String remarks;
    private Boolean academicIsActive;
    private Boolean academicIsDeleted;
    private LocalDateTime academicCreatedAt;
    private Integer academicCreatedBy;
    private LocalDateTime academicUpdatedAt;
    private Integer academicUpdatedBy;
    private Integer familyId;
    private String fatherName;
    private String fatherOccupation;
    private String fatherStatus;
    private String motherName;
    private String motherOccupation;
    private String motherStatus;
    private String siblingId;
    private String orphanStatus;
    private String imageUrl;

    private Integer guardianId;
    private String guardianName;
    private String guardianFirstName;
    private String guardianLastName;
    private Integer guardianRelationshipId;
    private String guardianPhone;
    private String phoneNumber;
    private String guardianRelationName;
    private String relationshipName;
    private String occ;
    private String addr;

    private String schName;
    private String schAddress;

    private String vilName;
    private Integer vilPincode;
    private String mndlName;
    private String distName;
    private String stName;
    private StudentAcademicResponseDto academicDetails;
}
