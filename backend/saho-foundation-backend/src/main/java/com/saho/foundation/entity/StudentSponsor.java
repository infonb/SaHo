package com.saho.foundation.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "student_sponsors")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentSponsor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "std_id")
    private Integer studentId;

    @Column(name = "spn_id")
    private Integer sponsorId;
    
    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "is_deleted")
    private Boolean isDeleted;

    @Column(name = "created_at")
    private LocalDate createdAt;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "modified_at")
    private LocalDate modifiedAt;

    @Column(name = "modified_by")
    private String modifiedBy;
}