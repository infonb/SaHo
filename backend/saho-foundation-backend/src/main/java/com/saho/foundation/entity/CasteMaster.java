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
@Table(name = "caste_master")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CasteMaster {

    @Id
    @Column(name = "caste_id")
    private Integer casteId;

    @Column(name = "caste_name")
    private String casteName;

    @Column(name = "is_deleted")
    private Boolean isDeleted;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}