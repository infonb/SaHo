package com.saho.foundation.ai.handler.reminder;

import java.util.Map;

public record ReminderActionContext(
    String search,
    String status,
    Map<String, Object> rawFilters
) {
}
