package com.saho.foundation.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminRequestDto {

    @JsonProperty("email_id")
    private String emailId;

    private String password;

    private String role;

    @JsonProperty("created_by")
    private String createdBy;
}
