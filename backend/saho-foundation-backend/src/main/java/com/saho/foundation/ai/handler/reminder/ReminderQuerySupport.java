package com.saho.foundation.ai.handler.reminder;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ReminderQuerySupport {

    private static final Set<String> SUPPORTED_FILTERS = Set.of(
        "search",
        "query",
        "keyword",
        "title",
        "venue",
        "status"
    );

    public ReminderActionContext buildActionContext(Map<String, Object> filters) {
        Map<String, Object> normalizedFilters = normalizeFilters(filters);
        validateSupportedFilters(normalizedFilters);

        String search = normalizeText(
            firstNonNull(
                normalizedFilters.get("search"),
                normalizedFilters.get("query"),
                normalizedFilters.get("keyword"),
                normalizedFilters.get("title"),
                normalizedFilters.get("venue")
            )
        );
        String status = normalizeStatus(normalizedFilters.get("status"));

        return new ReminderActionContext(search, status, normalizedFilters);
    }

    private Map<String, Object> normalizeFilters(Map<String, Object> filters) {
        Map<String, Object> normalizedFilters = new LinkedHashMap<>();
        if (filters == null) {
            return normalizedFilters;
        }

        filters.forEach((key, value) -> normalizedFilters.put(String.valueOf(key).toLowerCase(Locale.ROOT), value));
        return normalizedFilters;
    }

    private void validateSupportedFilters(Map<String, Object> filters) {
        Set<String> filterNames = filters.keySet().stream()
            .map(String::valueOf)
            .map(value -> value.toLowerCase(Locale.ROOT))
            .collect(Collectors.toSet());

        if (!SUPPORTED_FILTERS.containsAll(filterNames)) {
            throw new IllegalArgumentException("Unsupported filters: " + filterNames);
        }
    }

    private String normalizeStatus(Object value) {
        if (value == null) {
            return null;
        }

        String text = String.valueOf(value).trim().toLowerCase(Locale.ROOT);
        return switch (text) {
            case "upcoming", "ongoing", "completed", "cancelled" -> text;
            default -> StringUtils.hasText(text) ? text : null;
        };
    }

    private String normalizeText(Object value) {
        if (value == null) {
            return null;
        }

        String text = String.valueOf(value).trim();
        return text.isEmpty() ? null : text;
    }

    private Object firstNonNull(Object... values) {
        for (Object value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }
}
