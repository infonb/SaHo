package com.saho.foundation.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponseDto {

    private Integer userId;
    private Integer studentId;
    private String email;
    private String role;
    private boolean authenticated;
    private String token;
}
