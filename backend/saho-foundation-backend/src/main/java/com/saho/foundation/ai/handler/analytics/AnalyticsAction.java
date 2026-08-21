package com.saho.foundation.ai.handler.analytics;

import com.saho.foundation.ai.dto.ChatResponse;
import com.saho.foundation.ai.dto.IntentDTO;
import com.saho.foundation.ai.tool.AITool;

public interface AnalyticsAction extends AITool {

    @Override
    default String module() {
        return "analytics";
    }

    @Override
    default String toolName() {
        return "analytics." + action();
    }

    @Override
    default String description() {
        return "Handles analytics " + action() + " queries";
    }

    @Override
    default boolean supports(IntentDTO intent) {
        return AITool.super.supports(intent) && supports(intent != null ? intent.getAction() : null);
    }

    boolean supports(String action);

    ChatResponse handle(IntentDTO intent, String userMessage);

    @Override
    default ChatResponse execute(IntentDTO intent, String userMessage) {
        return handle(intent, userMessage);
    }

    @Override
    String action();
}
