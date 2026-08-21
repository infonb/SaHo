package com.saho.foundation.ai.tool;

import com.saho.foundation.ai.dto.ChatResponse;
import com.saho.foundation.ai.dto.IntentDTO;
import org.springframework.util.StringUtils;

import java.util.Locale;

public interface AITool {

    String module();

    String action();

    String toolName();

    String description();

    ChatResponse execute(IntentDTO intent, String userMessage);

    default boolean supports(IntentDTO intent) {
        return intent != null && supports(intent.getModule(), intent.getAction());
    }

    default boolean supports(String module, String action) {
        return StringUtils.hasText(module)
            && StringUtils.hasText(action)
            && module().equalsIgnoreCase(module.trim())
            && action().equalsIgnoreCase(action.trim().toLowerCase(Locale.ROOT));
    }
}
