package com.saho.foundation.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminResponseDto {

    @JsonProperty("user_id")
    private Integer userId;

    @JsonProperty("email_id")
    private String emailId;

    private String role;

    @JsonProperty("is_active")
    private Boolean isActive;

    @JsonProperty("created_at")
    private String createdAt;

    @JsonProperty("created_by")
    private String createdBy;
}
