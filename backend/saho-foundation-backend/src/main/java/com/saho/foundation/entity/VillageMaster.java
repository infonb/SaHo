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
@Table(name = "village_master")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VillageMaster {

    @Id
    @Column(name = "vil_id")
    private Integer vilId;

    @Column(name = "vil_name")
    private String vilName;

    @Column(name = "vil_pincode")
    private String vilPincode;

    @Column(name = "mndl_id")
    private Integer mndlId;

    @Column(name = "is_deleted")
    private Boolean isDeleted;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
