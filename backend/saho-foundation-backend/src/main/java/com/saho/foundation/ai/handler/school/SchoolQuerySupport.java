package com.saho.foundation.ai.handler.school;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class SchoolQuerySupport {

    private static final Set<String> SUPPORTED_FILTERS = Set.of(
        "search",
        "query",
        "keyword",
        "schoolname",
        "school",
        "schname",
        "address"
    );

    public SchoolActionContext buildActionContext(Map<String, Object> filters) {
        Map<String, Object> normalizedFilters = normalizeFilters(filters);
        validateSupportedFilters(normalizedFilters);

        String search = normalizeText(
            firstNonNull(
                normalizedFilters.get("schoolname"),
                normalizedFilters.get("school"),
                normalizedFilters.get("schname"),
                normalizedFilters.get("search"),
                normalizedFilters.get("query"),
                normalizedFilters.get("keyword"),
                normalizedFilters.get("address")
            )
        );

        return new SchoolActionContext(search, normalizedFilters);
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
