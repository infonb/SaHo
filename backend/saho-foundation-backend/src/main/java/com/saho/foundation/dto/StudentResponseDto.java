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
public class StudentResponseDto {

    private Integer studentId;
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
    private String academicYearName;
    private Integer familyId;
    private String fatherName;
    private String fatherOccupation;
    private String fatherStatus;
    private String motherName;
    private String motherOccupation;
    private String motherStatus;
    private String siblingId;
    private Integer guardianId;
    private String guardianName;
    private String guardianPhone;
    private String relationshipName;
    private String orphanStatus;
    private String imageUrl;
    private Boolean isDeleted;
    private LocalDateTime createdAt;
    private Integer createdBy;
    private LocalDateTime modifiedAt;
    private Integer modifiedBy;
    private GuardianDto guardian;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GuardianDto {
        private Integer guardianId;
        private String firstName;
        private String lastName;
        private String phoneNumber;
        private Integer relationshipId;
        private String occ;
        private String addr;
        private Boolean isDeleted;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}
