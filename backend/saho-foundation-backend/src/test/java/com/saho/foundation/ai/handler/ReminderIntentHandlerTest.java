package com.saho.foundation.ai.handler;

import com.saho.foundation.ai.dto.ChatResponse;
import com.saho.foundation.ai.dto.IntentDTO;
import com.saho.foundation.ai.exception.AIProcessingException;
import com.saho.foundation.ai.service.ResponseBuilder;
import com.saho.foundation.ai.tool.AITool;
import com.saho.foundation.ai.tool.AIToolRegistry;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ReminderIntentHandlerTest {

    private final AIToolRegistry toolRegistry = mock(AIToolRegistry.class);
    private final ResponseBuilder responseBuilder = new ResponseBuilder();
    private final ReminderIntentHandler handler = new ReminderIntentHandler(toolRegistry, responseBuilder);

    @Test
    void fallsBackToSearchToolWhenReminderActionLookupFails() {
        AITool searchTool = mock(AITool.class);

        IntentDTO genericReminderIntent = IntentDTO.builder()
            .module("reminders")
            .action("show")
            .filters(Map.of())
            .responseType("table")
            .build();

        IntentDTO normalizedSearchIntent = IntentDTO.builder()
            .module("reminders")
            .action("search")
            .filters(Map.of())
            .responseType("table")
            .build();

        when(toolRegistry.resolve(genericReminderIntent)).thenThrow(new AIProcessingException("No AI tool registered"));
        when(toolRegistry.resolve(normalizedSearchIntent)).thenReturn(searchTool);
        when(searchTool.toolName()).thenReturn("reminder.search");
        when(searchTool.execute(any(), any())).thenReturn(
            responseBuilder.text("fallback ok")
        );

        ChatResponse response = handler.handle(genericReminderIntent, "Show all reminders");

        assertEquals("text", response.getType());
        assertEquals("fallback ok", response.getMessage());
    }
}
