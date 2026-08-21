package com.saho.foundation.ai.handler;

import com.saho.foundation.ai.dto.ChatResponse;
import com.saho.foundation.ai.dto.IntentDTO;
import com.saho.foundation.ai.service.ResponseBuilder;
import com.saho.foundation.ai.tool.AITool;
import com.saho.foundation.ai.tool.AIToolRegistry;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsIntentHandlerTest {

    @Mock
    private AIToolRegistry toolRegistry;

    @Mock
    private ResponseBuilder responseBuilder;

    @Mock
    private AITool tool;

    @InjectMocks
    private AnalyticsIntentHandler analyticsIntentHandler;

    @Test
    void routesAnalyticsGraphIntentToRegisteredTool() {
        IntentDTO intent = IntentDTO.builder()
            .module("analytics")
            .action("graph")
            .build();

        ChatResponse expected = new ChatResponse();
        expected.setType("graph");

        when(toolRegistry.resolve(intent)).thenReturn(tool);
        when(tool.toolName()).thenReturn("analytics.graph");
        when(tool.execute(intent, "Show gender distribution")).thenReturn(expected);

        ChatResponse actual = analyticsIntentHandler.handle(intent, "Show gender distribution");

        assertEquals("graph", actual.getType());
        assertEquals(expected, actual);
    }

    @Test
    void returnsFriendlyMessageForUnsupportedAnalyticsIntent() {
        IntentDTO intent = IntentDTO.builder()
            .module("analytics")
            .action("unknown")
            .build();

        ChatResponse fallback = new ChatResponse();
        fallback.setType("text");
        fallback.setMessage("I'm sorry, I don't support that analytics query yet.");

        when(toolRegistry.resolve(intent)).thenThrow(new com.saho.foundation.ai.exception.AIProcessingException("unsupported"));
        when(responseBuilder.text("I'm sorry, I don't support that analytics query yet.")).thenReturn(fallback);

        ChatResponse actual = analyticsIntentHandler.handle(intent, "Show something else");

        assertEquals("text", actual.getType());
        assertEquals("I'm sorry, I don't support that analytics query yet.", actual.getMessage());
    }
}
