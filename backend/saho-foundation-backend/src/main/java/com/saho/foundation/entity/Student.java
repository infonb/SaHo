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

    @Column(name = "last_name", nullable = false, length = 20)
    private String lastName;

    @Column(name = "email_id", nullable = false, unique = true, length = 50)
    private String emailId;

    @Column(nullable = false)
    private LocalDate dob;

    @Column(name = "gender", nullable = false, length = 10)
    private String gender;

    @Column(name = "aadhaar_number", nullable = false, unique = true, length = 12)
    private String aadhaarNumber;

    @Column(name = "caste_id")
    private Integer casteId;

    @Column(name = "religion", length = 10)
    private String religion;

    @Column(name = "blood_group", length = 5)
    private String bloodGroup;

    @Column(name = "sch_id", nullable = false)
    private Integer schId;

    @Column(name = "class_id", nullable = false)
    private Integer classId;

    @Column(name = "academic_year_id")
    private Integer academicYearId;

    @ManyToOne(optional = false)
    @JoinColumn(name = "family_id", nullable = false)
    private StudentFamily family;

    // Stores sibling student ids as CSV like "2,3,5". If no siblings, it stays null.
    @Column(name = "sibling_id")
    private String siblingId;

    @ManyToOne(optional = false)
    @JoinColumn(name = "guardian_id", nullable = false)
    private Guardian guardian;

    @Column(name = "orphan_status", length = 10)
    private String orphanStatus;

    @Column(name = "image_url")
    private String imageUrl;

    @Builder.Default
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "created_by")
    private Integer createdBy;

    @Column(name = "modified_at")
    private LocalDateTime modifiedAt;

    @Column(name = "modified_by")
    private Integer modifiedBy;
}
