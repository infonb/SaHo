package com.saho.foundation.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentRequestDto {

    private String firstName;
    private String lastName;
    private String emailId;
    private LocalDate dob;
    private String gender;
    private String aadhaarNumber;
    private Integer casteId;
    private String religion;
    private String bloodGroup;
    private Integer schId;
    private Integer classId;
    private Integer academicYearId;
    private Integer familyId;
    private Integer guardianId;
    private String fatherName;
    private String fatherOccupation;
    private String fatherStatus;
    private String motherName;
    private String motherOccupation;
    private String motherStatus;
    private String orphanStatus;
    private String imageUrl;
    private Boolean isDeleted;
    private Integer createdBy;
    private Boolean hasSibling;
    private String siblingIds;
    private StudentAcademicRequestDto academicDetails;
    private GuardianRequestDto guardian;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GuardianRequestDto {
        private String firstName;
        private String lastName;
        private String phoneNumber;
        private Integer relationshipId;
        private String occ;
        private String addr;
        private Boolean isDeleted;
    }
}
