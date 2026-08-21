package com.saho.foundation.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntentDTO {
    private String module;
    private String action;
    private Map<String, Object> filters;
    private String responseType;
    private String reportType;
}
