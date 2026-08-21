package com.saho.foundation.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {

    private String type;
    private String title;
    private List<String> columns;
    private List<List<String>> rows;
    private Map<String, Object> data;
    private String message;
}
