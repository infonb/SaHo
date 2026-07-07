package com.saho.foundation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReminderRequestDto {
    private Integer remId; // 0 or null means create
    private String title;
    private String description;
    private LocalDate eventDate;
    private String venue;

    // lowest-level CSV (procedure normalizes hierarchy)
    private String stIdCsv;
    private String distIdsCsv;
    private String mndlIdsCsv;
    private String vilIdsCsv;
    private String schIdsCsv;
    private String classIdsCsv;
    private String imageUrl;
    private String bannerImage;

    private Integer updatedBy;
}

