package com.saho.foundation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReminderResponseDto {
    private Integer remId;
    private String title;
    private String description;
    private LocalDate eventDate;
    private String venue;
    private String stIdCsv;
    private String distIdsCsv;
    private String mndlIdsCsv;
    private String vilIdsCsv;
    private String schIdsCsv;
    private String classIdsCsv;
    private Boolean status;
    private Integer createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

