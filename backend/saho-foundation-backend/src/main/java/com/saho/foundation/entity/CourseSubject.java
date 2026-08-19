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
@Table(name = "course_subject")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseSubject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "course_subject_id")
    private Integer courseSubjectId;

    @Column(name = "course_id", nullable = false)
    private Integer courseId;

    @Column(name = "class_id", nullable = false)
    private Integer classId;

    @Column(name = "subject_id", nullable = false)
    private Integer subjectId;

    @Column(name = "subject_code", length = 50)
    private String subjectCode;

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