package com.saho.foundation.ai.handler.school;

import com.saho.foundation.ai.dto.ChatResponse;
import com.saho.foundation.ai.dto.IntentDTO;
import com.saho.foundation.ai.service.ResponseBuilder;
import com.saho.foundation.entity.SchoolMaster;
import com.saho.foundation.service.iservices.LocationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class SchoolSearchAction implements SchoolAction {

    private static final List<String> TABLE_COLUMNS = List.of(
        "School Name",
        "Address",
        "Village ID"
    );

    private final LocationService locationService;
    private final ResponseBuilder responseBuilder;
    private final SchoolQuerySupport schoolQuerySupport;

    @Override
    public boolean supports(String action) {
        if (!StringUtils.hasText(action)) {
            return false;
        }

        String normalized = action.trim().toLowerCase();
        return "search".equals(normalized) || "list".equals(normalized);
    }

    @Override
    public String action() {
        return "search";
    }

    @Override
    public ChatResponse handle(IntentDTO intent, String userMessage) {
        long startedAt = System.nanoTime();
        Map<String, Object> filters = intent != null && intent.getFilters() != null ? intent.getFilters() : Map.of();

        try {
            SchoolActionContext context = schoolQuerySupport.buildActionContext(filters);
            List<SchoolMaster> schools = resolveSchools(context);

            if (schools.isEmpty()) {
                log.info("School search returned no rows for userMessage='{}'", userMessage);
                return responseBuilder.text("No schools found.");
            }

            List<List<String>> rows = schools.stream()
                .map(this::toTableRow)
                .toList();

            ChatResponse tableResponse = responseBuilder.table("Schools", TABLE_COLUMNS, rows);
            log.info("SchoolSearchAction final response: {}", tableResponse);
            return tableResponse;
        } catch (IllegalArgumentException ex) {
            log.info("Unsupported school query for userMessage='{}': {}", userMessage, ex.getMessage());
            return responseBuilder.text("I'm sorry, I don't support that school query yet.");
        } catch (Exception ex) {
            log.error("School search failed for userMessage='{}'", userMessage, ex);
            return responseBuilder.text("I couldn't retrieve school information.");
        } finally {
            long elapsedMs = (System.nanoTime() - startedAt) / 1_000_000;
            log.info("School search action execution time: {} ms for userMessage='{}'", elapsedMs, userMessage);
        }
    }

    private List<SchoolMaster> resolveSchools(SchoolActionContext context) {
        List<SchoolMaster> schools = locationService.getAllSchools();
        if (!StringUtils.hasText(context.search())) {
            return schools;
        }

        String needle = context.search().trim().toLowerCase();
        return schools.stream()
            .filter(school -> containsIgnoreCase(school.getSchName(), needle)
                || containsIgnoreCase(school.getSchAddress(), needle)
                || containsIgnoreCase(String.valueOf(school.getVilId()), needle))
            .toList();
    }

    private List<String> toTableRow(SchoolMaster school) {
        return List.of(
            normalizeDisplayValue(school.getSchName()),
            normalizeDisplayValue(school.getSchAddress()),
            school.getVilId() != null ? String.valueOf(school.getVilId()) : "-"
        );
    }

    private boolean containsIgnoreCase(String value, String needle) {
        return StringUtils.hasText(value) && StringUtils.hasText(needle) && value.toLowerCase().contains(needle);
    }

    private String normalizeDisplayValue(String value) {
        return StringUtils.hasText(value) ? value.trim() : "-";
    }
}
