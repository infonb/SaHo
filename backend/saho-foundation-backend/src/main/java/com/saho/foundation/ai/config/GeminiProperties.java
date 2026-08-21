package com.saho.foundation.ai.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "saho.ai.gemini")
public record GeminiProperties(
    @NotBlank String baseUrl,
    @NotBlank String apiKey,
    @NotBlank String model
) {
}
