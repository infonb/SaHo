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

@Slf4j
@Component
@RequiredArgsConstructor
public class SponsorIntentHandler implements IntentHandler {

    private final AIToolRegistry toolRegistry;
    private final ResponseBuilder responseBuilder;

    @Override
    public boolean supports(String module) {
        return "sponsors".equalsIgnoreCase(StringUtils.trimWhitespace(module));
    }

    @Override
    public ChatResponse handle(IntentDTO intent, String userMessage) {
        log.info("SponsorIntentHandler received userMessage='{}', intent={}", userMessage, intent);

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
            log.info("Unsupported sponsor tool for userMessage='{}': {}", userMessage, ex.getMessage());
            return responseBuilder.unsupportedSponsorQuery();
        } catch (Exception ex) {
            log.error("Sponsor tool execution failed for userMessage='{}'", userMessage, ex);
            return responseBuilder.sponsorLookupFailure();
        }
    }
}
