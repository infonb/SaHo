package com.saho.foundation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "student_academic")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentAcademic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "student_academic_id")
    private Integer studentAcademicId;

    @Column(name = "student_id", nullable = false)
    private Integer studentId;

    @Column(name = "academic_year_id")
    private Integer academicYearId;

    @Column(name = "school_id")
    private Integer schoolId;

    @Column(name = "class_id")
    private Integer classId;

    @Column(name = "roll_number", length = 50)
    private String rollNumber;

    @Column(name = "admission_type", length = 50)
    private String admissionType;

    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "remarks", length = 255)
    private String remarks;

    @Builder.Default
    @Column(name = "is_active")
    private Boolean isActive = true;

    @Builder.Default
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "created_by")
    private Integer createdBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by")
    private Integer updatedBy;
}
