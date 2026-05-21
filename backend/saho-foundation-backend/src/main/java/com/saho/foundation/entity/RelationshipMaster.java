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
@Table(name = "relationship_master")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RelationshipMaster {

    @Id
    @Column(name = "relationship_id")
    private Integer relationshipId;

    @Column(name = "relationship_name")
    private String relationshipName;

    @Column(name = "description")
    private String description;

    @Column(name = "is_deleted")
    private Boolean isDeleted;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}