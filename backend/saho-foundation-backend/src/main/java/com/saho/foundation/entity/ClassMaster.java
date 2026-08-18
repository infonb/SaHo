package com.saho.foundation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "class_master")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassMaster {

    @Id
    @Column(name = "class_id")
    private Integer classId;

     @Column(name = "course_id")
    private Integer courseId;

    @Column(name = "class_name")
    private String className;

    @Column(name = "class_order")
    private Integer classOrder;

    @Column(name = "is_deleted")
    private Boolean isDeleted;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "created_by")
    private Integer createdBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
