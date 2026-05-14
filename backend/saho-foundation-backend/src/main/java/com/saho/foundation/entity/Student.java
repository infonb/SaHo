package com.saho.foundation.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "students")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "student_id")
    private Integer studentId;

    @Column(name = "first_name", nullable = false, length = 20)
    private String firstName;

    @Column(name = "middle_name", length = 20)
    private String middleName;

    @Column(name = "last_name", nullable = false, length = 20)
    private String lastName;

    @Column(name = "email_id", nullable = false, unique = true, length = 100)
    private String emailId;

    @Column(nullable = false)
    private LocalDate dob;

    @Column(nullable = false)
    private String gender;

    @Column(name = "aadhaar_number", nullable = false, unique = true, length = 12)
    private String aadhaarNumber;

    @Column(length = 20)
    private String caste;

    @Column(length = 20)
    private String religion;

    @Column(name = "blood_group", length = 5)
    private String bloodGroup;

    @Column(name = "sch_id", nullable = false)
    private Integer schId;

    @Column(name = "class_id", nullable = false)
    private Integer classId;

    @Column(name = "guardian_id", nullable = false)
    private Integer guardianId;

    @Column(name = "orphan_status")
    private String orphanStatus;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "modified_at")
    private LocalDateTime modifiedAt;

    @Column(name = "modified_by")
    private String modifiedBy;
}