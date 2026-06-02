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
@Table(name = "mandal_master")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MandalMaster {

    @Id
    @Column(name = "mndl_id")
    private Integer mndlId;

    @Column(name = "mndl_name")
    private String mndlName;

    @Column(name = "dist_id")
    private Integer distId;

    @Column(name = "is_deleted")
    private Boolean isDeleted;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
