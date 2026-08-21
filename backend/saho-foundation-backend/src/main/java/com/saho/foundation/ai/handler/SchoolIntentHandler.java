package com.saho.foundation.ai.handler;

import com.saho.foundation.ai.dto.ChatResponse;
import com.saho.foundation.ai.dto.IntentDTO;
import com.saho.foundation.ai.exception.AIProcessingException;
import com.saho.foundation.ai.handler.school.SchoolAction;
import com.saho.foundation.ai.router.IntentHandler;
import com.saho.foundation.ai.service.ResponseBuilder;
import com.saho.foundation.ai.tool.AITool;
import com.saho.foundation.ai.tool.AIToolRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Slf4j
@Component
@RequiredArgsConstructor
public class SchoolIntentHandler implements IntentHandler {

    private final AIToolRegistry toolRegistry;
    private final ResponseBuilder responseBuilder;

    @Override
    public boolean supports(String module) {
        return "schools".equalsIgnoreCase(StringUtils.trimWhitespace(module));
    }

    @Override
    public ChatResponse handle(IntentDTO intent, String userMessage) {
        log.info("SchoolIntentHandler received userMessage='{}', intent={}", userMessage, intent);

        try {
            AITool tool = toolRegistry.resolve(intent);
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
            log.info("Unsupported school tool for userMessage='{}': {}", userMessage, ex.getMessage());
            return responseBuilder.text("I'm sorry, I don't support that school query yet.");
        } catch (Exception ex) {
            log.error("School tool execution failed for userMessage='{}'", userMessage, ex);
            return responseBuilder.text("I couldn't retrieve school information.");
        }
    }
}
