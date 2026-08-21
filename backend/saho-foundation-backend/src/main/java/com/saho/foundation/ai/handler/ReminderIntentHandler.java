package com.saho.foundation.ai.handler;

import com.saho.foundation.ai.dto.ChatResponse;
import com.saho.foundation.ai.dto.IntentDTO;
import com.saho.foundation.ai.exception.AIProcessingException;
import com.saho.foundation.ai.router.IntentHandler;
import com.saho.foundation.ai.service.ResponseBuilder;
import com.saho.foundation.ai.tool.AITool;
import com.saho.foundation.ai.tool.AIToolRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReminderIntentHandler implements IntentHandler {

    private final AIToolRegistry toolRegistry;
    private final ResponseBuilder responseBuilder;

    @Override
    public boolean supports(String module) {
        return "reminders".equalsIgnoreCase(StringUtils.trimWhitespace(module));
    }

    @Override
    public ChatResponse handle(IntentDTO intent, String userMessage) {
        log.info("ReminderIntentHandler received userMessage='{}', intent={}", userMessage, intent);

        try {
            AITool tool = resolveReminderTool(intent);
            log.info(
                "Selected AI tool '{}' for module='{}', action='{}'",
                tool.toolName(),
                intent.getModule(),
                intent.getAction()
            );

            ChatResponse response = tool.execute(intent, userMessage);
            log.info("Tool response: {}", response);
            return response;
        } catch (AIProcessingException ex) {
            log.info("Unsupported reminder tool for userMessage='{}': {}", userMessage, ex.getMessage());
            return responseBuilder.text("I'm sorry, I don't support that reminder query yet.");
        } catch (Exception ex) {
            log.error("Reminder tool execution failed for userMessage='{}'", userMessage, ex);
            return responseBuilder.text("I couldn't retrieve reminder information.");
        }
    }

    private AITool resolveReminderTool(IntentDTO intent) {
        try {
            return toolRegistry.resolve(intent);
        } catch (AIProcessingException ex) {
            IntentDTO fallbackIntent = normalizeToSearchIntent(intent);
            if (fallbackIntent == null) {
                throw ex;
            }

            log.info(
                "Retrying reminder tool resolution with normalized action='{}' for user intent action='{}'",
                fallbackIntent.getAction(),
                intent != null ? intent.getAction() : null
            );
            return toolRegistry.resolve(fallbackIntent);
        }
    }

    private IntentDTO normalizeToSearchIntent(IntentDTO intent) {
        if (intent == null || !StringUtils.hasText(intent.getModule())) {
            return null;
        }

        if (!supports(intent.getModule())) {
            return null;
        }

        Map<String, Object> filters = new LinkedHashMap<>();
        if (intent.getFilters() != null) {
            filters.putAll(intent.getFilters());
        }

        return IntentDTO.builder()
            .module("reminders")
            .action("search")
            .filters(filters)
            .responseType(StringUtils.hasText(intent.getResponseType()) ? intent.getResponseType() : "table")
            .reportType(intent.getReportType())
            .build();
    }
}
