package com.saho.foundation.ai.handler.sponsor;

import com.saho.foundation.ai.dto.ChatResponse;
import com.saho.foundation.ai.dto.IntentDTO;
import com.saho.foundation.ai.tool.AITool;

public interface SponsorAction extends AITool {

    @Override
    default String module() {
        return "sponsors";
    }

    @Override
    default String toolName() {
        return "sponsor." + action();
    }

    @Override
    default String description() {
        return "Handles sponsor " + action() + " queries";
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
