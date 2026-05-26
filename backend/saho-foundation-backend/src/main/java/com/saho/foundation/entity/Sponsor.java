package com.saho.foundation.entity;

import jakarta.persistence.*;
import jakarta.websocket.Decoder.Text;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "sponsors")
@Data
public class Sponsor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sponsor_id")
    private Integer sponsorId;

    @Column(name = "sponsor_name")
    private String sponsorName;

    @Column(name = "nationality")
    private String nationality;

    @Column(name = "sponsor_type")
    private String sponsorType;

    @Column(name = "email")
    private String email;

    @Column(name = "dob")
    private LocalDate dob;

    @Column(name = "ph_no")
    private String phoneNumber;

    @Column(name = "loc")
    private String location;

    @Column(name = "contrib")
    private String contribution;

    @Column(name = "is_deleted")
    private Boolean isDeleted;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "created_by")
    private Integer createdBy;

    @Column(name = "modified_at")
    private LocalDateTime modifiedAt;

    @Column(name = "modified_by")
    private Integer modifiedBy;
}