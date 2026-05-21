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
@Table(name = "school_master")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchoolMaster {

    @Id
    @Column(name = "sch_id")
    private Integer schId;

    @Column(name = "sch_name")
    private String schName;

    @Column(name = "sch_address")
    private String schAddress;

    @Column(name = "vil_id")
    private Integer vilId;

    @Column(name = "is_deleted")
    private Boolean isDeleted;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
