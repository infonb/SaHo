package com.saho.foundation.ai.router;

import com.saho.foundation.ai.dto.ChatResponse;
import com.saho.foundation.ai.dto.IntentDTO;

public interface IntentHandler {

    boolean supports(String module);

    ChatResponse handle(IntentDTO intent, String userMessage);
}
