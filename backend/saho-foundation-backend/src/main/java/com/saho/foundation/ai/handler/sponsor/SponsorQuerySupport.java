package com.saho.foundation.ai.handler.sponsor;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.YearMonth;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.lang.reflect.Method;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class SponsorQuerySupport {

    private static final DateTimeFormatter MONTH_LABEL = DateTimeFormatter.ofPattern("MMM-yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter SHORT_MONTH_YEAR = DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter LONG_MONTH_YEAR = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH);
    private static final Set<String> SUPPORTED_FILTERS = Set.of(
        "search",
        "query",
        "keyword",
        "sponsorname",
        "sponsor",
        "type",
        "sponsortype",
        "nationality",
        "createdmonth"
    );

    public SponsorActionContext buildActionContext(Map<String, Object> filters) {
        Map<String, Object> normalizedFilters = normalizeFilters(filters);
        validateSupportedFilters(normalizedFilters);

        String search = normalizeText(
            firstNonNull(
                normalizedFilters.get("sponsorname"),
                normalizedFilters.get("sponsor"),
                normalizedFilters.get("search"),
                normalizedFilters.get("query"),
                normalizedFilters.get("keyword")
            )
        );
        String sponsorType = normalizeText(
            firstNonNull(
                normalizedFilters.get("type"),
                normalizedFilters.get("sponsortype")
            )
        );
        String nationality = normalizeText(normalizedFilters.get("nationality"));
        String createdMonth = normalizeCreatedMonth(
            firstNonNull(
                normalizedFilters.get("createdmonth"),
                normalizedFilters.get("createdmonthlabel")
            )
        );

        if (StringUtils.hasText(createdMonth)) {
            normalizedFilters.put("createdmonth", createdMonth);
        }

        return new SponsorActionContext(search, sponsorType, nationality, createdMonth, normalizedFilters);
    }

    public List<com.saho.foundation.dto.response.SponsorResponseDto> filterByCreatedMonth(
        List<com.saho.foundation.dto.response.SponsorResponseDto> sponsors,
        String createdMonth
    ) {
        if (!StringUtils.hasText(createdMonth) || sponsors == null || sponsors.isEmpty()) {
            return sponsors == null ? List.of() : sponsors;
        }

        YearMonth targetMonth = parseMonth(createdMonth);
        if (targetMonth == null) {
            return sponsors;
        }

        return sponsors.stream()
            .filter(sponsor -> sponsor != null
                && resolveCreatedAt(sponsor) != null
                && YearMonth.from(resolveCreatedAt(sponsor)).equals(targetMonth))
            .toList();
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

    private String normalizeCreatedMonth(Object value) {
        String text = normalizeText(value);
        if (!StringUtils.hasText(text)) {
            return null;
        }

        YearMonth parsed = parseMonth(text);
        return parsed != null ? parsed.format(MONTH_LABEL) : text;
    }

    private YearMonth parseMonth(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        String text = value.trim();
        List<DateTimeFormatter> formatters = List.of(
            new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("MMM-yyyy").toFormatter(Locale.ENGLISH),
            new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("MMM yyyy").toFormatter(Locale.ENGLISH),
            new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("MMMM yyyy").toFormatter(Locale.ENGLISH),
            new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("yyyy-MM").toFormatter(Locale.ENGLISH),
            new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("yyyy/MM").toFormatter(Locale.ENGLISH)
        );

        for (DateTimeFormatter formatter : formatters) {
            try {
                return YearMonth.parse(text, formatter);
            } catch (DateTimeParseException ex) {
                // try the next supported format
            }
        }

        return null;
    }

    private Object firstNonNull(Object... values) {
        for (Object value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private java.time.LocalDateTime resolveCreatedAt(com.saho.foundation.dto.response.SponsorResponseDto sponsor) {
        if (sponsor == null) {
            return null;
        }

        try {
            Method getter = sponsor.getClass().getMethod("getCreatedAt");
            Object value = getter.invoke(sponsor);
            if (value instanceof java.time.LocalDateTime localDateTime) {
                return localDateTime;
            }
        } catch (Exception ignored) {
            // Fall back to no month filtering if the runtime DTO is missing the getter.
        }

        return null;
    }
}
