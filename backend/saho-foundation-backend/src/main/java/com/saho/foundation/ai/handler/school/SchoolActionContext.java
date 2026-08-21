package com.saho.foundation.ai.handler.school;

import java.util.Map;

public record SchoolActionContext(
    String search,
    Map<String, Object> rawFilters
) {
}
