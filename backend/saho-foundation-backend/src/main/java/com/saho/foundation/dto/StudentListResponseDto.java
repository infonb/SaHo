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
    private Integer studentAcademicId;
    private Integer schId;
    private Integer schoolId;
    private Integer classId;
    private Integer academicYearId;
    private String academicYearName;
    private String rollNumber;
    private String admissionType;
    private String status;
    private String annualResult;
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
    private Integer guardianId;
    private String schName;
    private String schAddress;
    private String className;
    private String guardianName;
    private String guardianPhone;
    private String guardianRelationName;
    private String relationshipName;
    private String vilName;
    private String mndlName;
    private String distName;
    private String stName;
    private String siblingId;
    private String orphanStatus;
    private Integer sponsorId;
    private String sponsorName;
    private Integer totalCount;
    private Integer boysCount;
    private Integer girlsCount;
    private Integer sponsoredCount;
    private Integer orphansCount;
    private String imageUrl;
    private LocalDateTime createdAt;
    private Integer createdBy;
    private LocalDateTime modifiedAt;
    private Integer modifiedBy;
    private StudentAcademicResponseDto academicDetails;
}
