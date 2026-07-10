package com.saho.foundation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReminderFilterDto {
    private String search;
    private Integer pageNumber;
    private Integer pageSize;
    private String stateIdsCsv;
    private String distIdsCsv;
    private String mndlIdsCsv;
    private String vilIdsCsv;
    private String schIdsCsv;
    private String status;
}
