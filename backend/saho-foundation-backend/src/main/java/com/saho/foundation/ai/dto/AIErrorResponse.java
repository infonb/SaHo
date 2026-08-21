package com.saho.foundation.ai.dto;

import java.time.LocalDateTime;

public record AIErrorResponse(
    LocalDateTime timestamp,
    int status,
    String error,
    String path
) {
}
