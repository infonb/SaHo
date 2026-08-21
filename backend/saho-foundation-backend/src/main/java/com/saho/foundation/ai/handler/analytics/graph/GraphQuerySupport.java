package com.saho.foundation.ai.handler.analytics.graph;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class GraphQuerySupport {

    private static final Pattern GRAPH_HINT = Pattern.compile("\\b(graph|chart|plot|visuali[sz]e|analytics|analysis|distribution|breakdown|trend|trends|wise)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern GENDER_HINT = Pattern.compile("\\bgender\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern DISTRICT_HINT = Pattern.compile("\\bdistrict\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern STATE_HINT = Pattern.compile("\\bstate\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern SPONSOR_HINT = Pattern.compile("\\bsponsors?\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern REMINDER_HINT = Pattern.compile("\\breminders?\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern SCHOOL_HINT = Pattern.compile("\\bschools?\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern AGE_HINT = Pattern.compile("\\bage\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern MONTHLY_HINT = Pattern.compile("\\bmonthly\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern TREND_HINT = Pattern.compile("\\btrend(s)?\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern COUNT_HINT = Pattern.compile("\\bcount\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern DISTRIBUTION_HINT = Pattern.compile("\\bdistribution\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern DONUT_HINT = Pattern.compile("\\bdonut\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern PIE_HINT = Pattern.compile("\\bpie\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern LINE_HINT = Pattern.compile("\\bline\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern AREA_HINT = Pattern.compile("\\barea\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern BAR_HINT = Pattern.compile("\\bbar\\b", Pattern.CASE_INSENSITIVE);

    public GraphActionContext buildActionContext(Map<String, Object> filters, String userMessage) {
        String normalizedMessage = normalize(userMessage);
        Map<String, Object> rawFilters = new LinkedHashMap<>();
        if (filters != null) {
            rawFilters.putAll(filters);
        }

        String datasetKey = resolveDatasetKey(rawFilters, normalizedMessage);
        String chartType = resolveChartType(rawFilters, normalizedMessage, datasetKey);
        String title = resolveTitle(datasetKey);
        String xAxis = resolveXAxis(datasetKey);
        String yAxis = resolveYAxis(datasetKey);
        String seriesLabel = resolveSeriesLabel(datasetKey);

        rawFilters.putIfAbsent("graphDataset", datasetKey);
        rawFilters.put("chartType", chartType);

        return new GraphActionContext(datasetKey, chartType, title, xAxis, yAxis, seriesLabel, rawFilters);
    }

    private String resolveDatasetKey(Map<String, Object> filters, String normalizedMessage) {
        Object filterDataset = filters.get("graphDataset");
        if (filterDataset instanceof String text && StringUtils.hasText(text)) {
            return normalizeDatasetKey(text);
        }

        if (matches(normalizedMessage, GENDER_HINT) && (matches(normalizedMessage, DISTRIBUTION_HINT) || matches(normalizedMessage, GRAPH_HINT))) {
            return "gender_distribution";
        }

        if (matches(normalizedMessage, DISTRICT_HINT) && matches(normalizedMessage, COUNT_HINT)) {
            return "district_student_count";
        }

        if (matches(normalizedMessage, STATE_HINT) && normalizedMessage.contains("orphan")) {
            return "state_orphan_students";
        }

        if (matches(normalizedMessage, SPONSOR_HINT) && (matches(normalizedMessage, MONTHLY_HINT) || matches(normalizedMessage, TREND_HINT))) {
            return matches(normalizedMessage, TREND_HINT) ? "sponsorship_trends" : "monthly_sponsor_registrations";
        }

        if (matches(normalizedMessage, REMINDER_HINT) && matches(normalizedMessage, Pattern.compile("\\bstatus\\b", Pattern.CASE_INSENSITIVE))) {
            return "reminder_status_distribution";
        }

        if (matches(normalizedMessage, SCHOOL_HINT) && matches(normalizedMessage, COUNT_HINT)) {
            return "school_student_count";
        }

        if (matches(normalizedMessage, AGE_HINT)) {
            return "age_distribution";
        }

        if (matches(normalizedMessage, SPONSOR_HINT) && matches(normalizedMessage, TREND_HINT)) {
            return "sponsorship_trends";
        }

        if (matches(normalizedMessage, GRAPH_HINT)) {
            if (normalizedMessage.contains("gender")) {
                return "gender_distribution";
            }
            if (normalizedMessage.contains("district")) {
                return "district_student_count";
            }
            if (normalizedMessage.contains("orphan") && normalizedMessage.contains("state")) {
                return "state_orphan_students";
            }
            if (normalizedMessage.contains("reminder")) {
                return "reminder_status_distribution";
            }
            if (normalizedMessage.contains("school")) {
                return "school_student_count";
            }
        }

        return "unknown";
    }

    private String resolveChartType(Map<String, Object> filters, String normalizedMessage, String datasetKey) {
        Object filterChartType = filters.get("chartType");
        if (filterChartType instanceof String text && StringUtils.hasText(text)) {
            return normalizeChartType(text);
        }

        if (DONUT_HINT.matcher(normalizedMessage).find()) {
            return "donut";
        }
        if (PIE_HINT.matcher(normalizedMessage).find()) {
            return "pie";
        }
        if (LINE_HINT.matcher(normalizedMessage).find()) {
            return "line";
        }
        if (AREA_HINT.matcher(normalizedMessage).find()) {
            return "area";
        }
        if (BAR_HINT.matcher(normalizedMessage).find()) {
            return "bar";
        }

        return switch (datasetKey) {
            case "gender_distribution", "reminder_status_distribution" -> "donut";
            case "monthly_sponsor_registrations" -> "line";
            case "sponsorship_trends" -> "area";
            default -> "bar";
        };
    }

    private String resolveTitle(String datasetKey) {
        return switch (datasetKey) {
            case "gender_distribution" -> "Gender Distribution";
            case "district_student_count" -> "Students by District";
            case "state_orphan_students" -> "State-wise Orphan Students";
            case "monthly_sponsor_registrations" -> "Monthly Sponsor Registrations";
            case "reminder_status_distribution" -> "Reminder Status Distribution";
            case "school_student_count" -> "Students by School";
            case "age_distribution" -> "Age Distribution";
            case "sponsorship_trends" -> "Sponsorship Trends";
            default -> "Analytics";
        };
    }

    private String resolveXAxis(String datasetKey) {
        return switch (datasetKey) {
            case "gender_distribution" -> "Gender";
            case "district_student_count" -> "District";
            case "state_orphan_students" -> "State";
            case "monthly_sponsor_registrations", "sponsorship_trends" -> "Month";
            case "reminder_status_distribution" -> "Status";
            case "school_student_count" -> "School";
            case "age_distribution" -> "Age Group";
            default -> "Category";
        };
    }

    private String resolveYAxis(String datasetKey) {
        return switch (datasetKey) {
            case "monthly_sponsor_registrations", "sponsorship_trends" -> "Sponsors";
            case "age_distribution" -> "Students";
            case "reminder_status_distribution" -> "Reminders";
            default -> "Students";
        };
    }

    private String resolveSeriesLabel(String datasetKey) {
        return switch (datasetKey) {
            case "monthly_sponsor_registrations", "sponsorship_trends" -> "Sponsors";
            case "reminder_status_distribution" -> "Reminders";
            default -> "Students";
        };
    }

    private boolean matches(String value, Pattern pattern) {
        return StringUtils.hasText(value) && pattern.matcher(value).find();
    }

    private String normalize(String value) {
        return StringUtils.hasText(value) ? value.trim().toLowerCase(Locale.ROOT) : "";
    }

    private String normalizeDatasetKey(String value) {
        return value.trim().toLowerCase(Locale.ROOT).replace(' ', '_');
    }

    private String normalizeChartType(String value) {
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "donut", "pie", "line", "area", "bar" -> normalized;
            default -> "bar";
        };
    }

    public record GraphActionContext(
        String datasetKey,
        String chartType,
        String title,
        String xAxis,
        String yAxis,
        String seriesLabel,
        Map<String, Object> rawFilters
    ) {
    }
}
