package com.saho.foundation.ai.service;

import com.saho.foundation.ai.config.GeminiProperties;
import com.saho.foundation.ai.exception.AIProcessingException;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiService {

    private static final String GENERATE_CONTENT_PATH = "/models/{model}:generateContent";

    private final RestClient geminiRestClient;
    private final GeminiProperties geminiProperties;
    private final PromptBuilder promptBuilder;
    private final ObjectMapper objectMapper;

    public String generateResponse(String userMessage) {
        String normalizedMessage = StringUtils.trimWhitespace(userMessage);
        if (!StringUtils.hasText(normalizedMessage)) {
            throw new IllegalArgumentException("message is required");
        }

        PromptBuilder.PromptContext promptContext = promptBuilder.buildPrompt(normalizedMessage);
        GeminiGenerateContentRequest request = new GeminiGenerateContentRequest(
            new GeminiSystemInstruction(List.of(new GeminiPart(promptContext.systemPrompt()))),
            List.of(new GeminiContent("user", List.of(new GeminiPart(promptContext.userPrompt())))),
            new GeminiGenerationConfig("application/json", 0.0d)
        );
        String finalUrl = UriComponentsBuilder.fromHttpUrl(geminiProperties.baseUrl())
            .path(GENERATE_CONTENT_PATH.replace("{model}", geminiProperties.model()))
            .toUriString();
        String requestJson = null;

        try {
            requestJson = objectMapper.writeValueAsString(request);
            log.info("Sending user message to Gemini intent interpreter: {}", normalizedMessage);
            log.info("Gemini URL: {}", finalUrl);
            log.info("Gemini model: {}", geminiProperties.model());
            log.info("Gemini request JSON: {}", requestJson);
            log.info("Gemini API key length: {}", geminiProperties.apiKey().length());

            GeminiGenerateContentResponse response = geminiRestClient.post()
                .uri(uriBuilder -> uriBuilder
                    .path(GENERATE_CONTENT_PATH)
                    .queryParam("key", geminiProperties.apiKey())
                    .build(geminiProperties.model()))
                .body(request)
                .retrieve()
                .body(GeminiGenerateContentResponse.class);

            log.info("Gemini Response: {}", objectMapper.writeValueAsString(response));

            String rawResponse = extractText(response);
            if (!StringUtils.hasText(rawResponse)) {
                throw new AIProcessingException("Gemini returned an empty response");
            }

            log.info("Raw JSON returned by Gemini: {}", rawResponse);
            return rawResponse.trim();
        } catch (RestClientResponseException ex) {
            int statusCode = ex.getRawStatusCode();
            String responseBody = ex.getResponseBodyAsString();

            log.error("Gemini request failed");
            log.error("Gemini URL: {}", finalUrl);
            log.error("Gemini model: {}", geminiProperties.model());
            log.error("Gemini request JSON: {}", requestJson);
            log.error("Gemini API key length: {}", geminiProperties.apiKey().length());
            log.error("Gemini status code: {}", statusCode);
            log.error("Gemini response headers: {}", ex.getResponseHeaders());
            log.error("Gemini response body: {}", responseBody);

            if (statusCode == 400) {
                log.error("Gemini returned HTTP 400. Full JSON error response: {}", responseBody);
            } else if (statusCode == 401 || statusCode == 403) {
                log.error("Gemini returned HTTP {}. The API key is invalid, missing, or not authorized.", statusCode);
            } else if (statusCode == 404) {
                log.error("Gemini returned HTTP 404. The model name is wrong or unavailable: {}", geminiProperties.model());
            } else if (statusCode == 429) {
                log.error("Gemini returned HTTP 429. Quota is exhausted or rate-limited.");
            } else if (statusCode == 503) {
                log.error("Gemini returned HTTP 503. Gemini service is unavailable.");
            }

            log.error("Gemini error stacktrace:", ex);
            throw new AIProcessingException("Gemini request failed", ex);
        } catch (RestClientException ex) {
            log.error("Gemini request could not be completed for URL {}", finalUrl, ex);
            throw new AIProcessingException("Gemini request failed", ex);
        } catch (JsonProcessingException ex) {
            log.error("Failed to serialize Gemini request or response for URL {}", finalUrl, ex);
            throw new AIProcessingException("Unexpected error while processing Gemini response", ex);
        } catch (AIProcessingException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Unexpected Gemini error for URL {}", finalUrl, ex);
            throw new AIProcessingException("Unexpected error while processing Gemini response", ex);
        }
    }

    private String extractText(GeminiGenerateContentResponse response) {
        if (response == null || response.candidates() == null || response.candidates().isEmpty()) {
            return "";
        }

        for (GeminiCandidate candidate : response.candidates()) {
            if (candidate == null || candidate.content() == null || candidate.content().parts() == null) {
                continue;
            }

            for (GeminiPart part : candidate.content().parts()) {
                if (part != null && StringUtils.hasText(part.text())) {
                    return part.text();
                }
            }
        }

        return "";
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GeminiGenerateContentRequest(
        @JsonProperty("systemInstruction") GeminiSystemInstruction systemInstruction,
        @JsonProperty("contents") List<GeminiContent> contents,
        @JsonProperty("generationConfig") GeminiGenerationConfig generationConfig
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GeminiSystemInstruction(List<GeminiPart> parts) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GeminiContent(String role, List<GeminiPart> parts) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GeminiPart(String text) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GeminiGenerationConfig(
        @JsonProperty("responseMimeType") String responseMimeType,
        @JsonProperty("temperature") double temperature
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GeminiGenerateContentResponse(List<GeminiCandidate> candidates) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GeminiCandidate(GeminiCandidateContent content) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GeminiCandidateContent(List<GeminiPart> parts) {
    }
}
