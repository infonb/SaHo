package com.saho.foundation.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

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
    @JsonProperty("std_id")
    @Getter(onMethod_ = {@JsonIgnore})
    private Integer studentId;

    @Column(name = "spn_id")
    @JsonProperty("spn_id")
    @Getter(onMethod_ = {@JsonIgnore})
    private Integer sponsorId;
    
    @Column(name = "is_active")
    @JsonProperty("is_active")
    @Getter(onMethod_ = {@JsonIgnore})
    private Boolean isActive;

    @Column(name = "is_deleted")
    @JsonProperty("is_deleted")
    @Getter(onMethod_ = {@JsonIgnore})
    private Boolean isDeleted;

    @Column(name = "created_at")
    @JsonProperty("created_at")
    @Getter(onMethod_ = {@JsonIgnore})
    private LocalDate createdAt;

    @Column(name = "created_by")
    @JsonProperty("created_by")
    @Getter(onMethod_ = {@JsonIgnore})
    private String createdBy;

    @Column(name = "modified_at")
    @JsonProperty("modified_at")
    @Getter(onMethod_ = {@JsonIgnore})
    private LocalDate modifiedAt;

    @Column(name = "modified_by")
    @JsonProperty("modified_by")
    @Getter(onMethod_ = {@JsonIgnore})
    private String modifiedBy;
}