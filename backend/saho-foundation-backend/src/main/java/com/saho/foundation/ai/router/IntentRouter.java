package com.saho.foundation.ai.router;

import com.saho.foundation.ai.dto.ChatResponse;
import com.saho.foundation.ai.dto.IntentDTO;
import com.saho.foundation.ai.service.ResponseBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class IntentRouter {

    private final List<IntentHandler> handlers;
    private final ResponseBuilder responseBuilder;

    public ChatResponse route(IntentDTO intent, String userMessage) {
        String module = intent != null ? intent.getModule() : null;
        String action = intent != null ? intent.getAction() : null;
        log.info("Routing intent with module='{}', action='{}'", module, action);
        IntentHandler handler = handlers.stream()
            .filter(candidate -> candidate.supports(module))
            .findFirst()
            .orElse(null);

        if (handler == null) {
            log.info("No handler registered for module: {}", module);
            return responseBuilder.unknownModule(module);
        }

        log.info("Selected handler: {}", handler.getClass().getSimpleName());
        ChatResponse response = handler.handle(intent, userMessage);
        log.info("Handler response: {}", response);
        return response;
    }
}
