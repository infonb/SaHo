package com.saho.foundation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "reminders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reminder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rem_id")
    private Integer remId;

    @Column(name = "title")
    private String title;

    @Column(name = "description")
    private String description;

    @Column(name = "event_date")
    private LocalDate eventDate;

    @Column(name = "venue")
    private String venue;

    @Column(name = "st_id_csv")
    private String stIdCsv;

    @Column(name = "dist_ids_csv")
    private String distIdsCsv;

    @Column(name = "mndl_ids_csv")
    private String mndlIdsCsv;

    @Column(name = "vil_ids_csv")
    private String vilIdsCsv;

    @Column(name = "sch_ids_csv")
    private String schIdsCsv;

    @Column(name = "class_ids_csv")
    private String classIdsCsv;

    @Builder.Default
    @Column(name = "status")
    private Boolean status = true;

    @Column(name = "created_by")
    private Integer createdBy;

    @Column(name = "updated_by")
    private Integer updatedBy;

    @Builder.Default
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
