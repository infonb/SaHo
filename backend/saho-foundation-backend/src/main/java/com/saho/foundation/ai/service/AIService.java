package com.saho.foundation.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.saho.foundation.ai.dto.ChatResponse;
import com.saho.foundation.ai.dto.IntentDTO;
import com.saho.foundation.ai.exception.AIProcessingException;
import com.saho.foundation.ai.router.IntentRouter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIService {

    private static final Set<String> GREETINGS = Set.of(
        "hello",
        "hi",
        "hey",
        "good morning",
        "good afternoon",
        "good evening"
    );

    private final ObjectMapper objectMapper;
    private final IntentRouter intentRouter;
    private final LocalIntentParser localIntentParser;
    private final GeminiService geminiService;
    private final ResponseBuilder responseBuilder;
    private final ConversationMemoryService conversationMemoryService;

    public ChatResponse processMessage(String message) {
        return processMessage(message, null);
    }

    public ChatResponse processMessage(String message, String sessionId) {
        String normalizedMessage = message == null ? "" : message.trim();
        if (normalizedMessage.isEmpty()) {
            throw new IllegalArgumentException("message is required");
        }

        long startedAt = System.nanoTime();
        log.info("Original user prompt: {}", normalizedMessage);

        if (isGreeting(normalizedMessage)) {
            log.info("Greeting detected. Returning direct AI assistant greeting without Gemini.");
            ChatResponse response = responseBuilder.greeting();
            log.info("Final ChatResponse: {}", response);
            return response;
        }

        try {
            IntentDTO localIntent = localIntentParser.parse(normalizedMessage).orElse(null);
            if (localIntent != null) {
                log.info("Local parsed IntentDTO: {}", localIntent);
                localIntent = conversationMemoryService.applyContext(sessionId, normalizedMessage, localIntent).orElse(localIntent);
                log.info("Skipping Gemini and routing directly using local intent.");
                ChatResponse response = intentRouter.route(localIntent, normalizedMessage);
                conversationMemoryService.remember(sessionId, normalizedMessage, localIntent);
                log.info("Final ChatResponse: {}", response);
                long elapsedMs = (System.nanoTime() - startedAt) / 1_000_000;
                log.info("AI intent execution completed in {} ms", elapsedMs);
                return response;
            }

            String rawJson = geminiService.generateResponse(normalizedMessage);
            log.info("Gemini raw response: {}", rawJson);
            String sanitizedJson = sanitizeJsonPayload(rawJson);
            log.info("Gemini sanitized response: {}", sanitizedJson);
            IntentDTO intent = parseIntent(sanitizedJson);
            log.info("Parsed IntentDTO: {}", intent);
            intent = conversationMemoryService.applyContext(sessionId, normalizedMessage, intent).orElse(intent);

            ChatResponse response = intentRouter.route(intent, normalizedMessage);
            conversationMemoryService.remember(sessionId, normalizedMessage, intent);
            log.info("Final ChatResponse: {}", response);
            long elapsedMs = (System.nanoTime() - startedAt) / 1_000_000;
            log.info("AI intent execution completed in {} ms", elapsedMs);
            return response;
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (AIProcessingException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new AIProcessingException("Failed to process AI message", ex);
        }
    }

    private boolean isGreeting(String message) {
        String normalized = message
            .trim()
            .replaceAll("[!.,?]+$", "")
            .toLowerCase(Locale.ROOT);

        return GREETINGS.contains(normalized);
    }

    private IntentDTO parseIntent(String rawJson) {
        try {
            IntentDTO intent = objectMapper.readValue(rawJson, IntentDTO.class);
            if (intent.getFilters() == null) {
                intent.setFilters(new LinkedHashMap<>());
            }
            return intent;
        } catch (JsonProcessingException ex) {
            throw new AIProcessingException("Failed to parse intent JSON from Gemini", ex);
        }
    }

    private String sanitizeJsonPayload(String payload) {
        if (!StringUtils.hasText(payload)) {
            return payload;
        }

        String trimmed = payload.trim();
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.replaceFirst("^```(?:json)?\\s*", "");
            trimmed = trimmed.replaceFirst("\\s*```\\s*$", "");
        }

        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return trimmed.substring(start, end + 1).trim();
        }

        return trimmed;
    }
}
