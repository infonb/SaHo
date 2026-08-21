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

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_marks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentMarks {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "student_marks_id")
    private Integer studentMarksId;

    @Column(name = "student_academic_id", nullable = false)
    private Integer studentAcademicId;

    @Column(name = "course_subject_id", nullable = false)
    private Integer courseSubjectId;

    @Column(name = "marks", precision = 5, scale = 2)
    private BigDecimal marks;

    @Column(name = "grade", length = 10)
    private String grade;

    @Column(name = "result", length = 20)
    private String result;

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