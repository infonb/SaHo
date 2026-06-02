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
@Table(name = "district_master")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DistrictMaster {

    @Id
    @Column(name = "dist_id")
    private Integer distId;

    @Column(name = "dist_name")
    private String distName;

    @Column(name = "st_id")
    private Integer stId;

    @Column(name = "is_deleted")
    private Boolean isDeleted;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
