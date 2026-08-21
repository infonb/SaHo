package com.saho.foundation.ai.handler.reminder;

import com.saho.foundation.ai.dto.ChatResponse;
import com.saho.foundation.ai.dto.IntentDTO;
import com.saho.foundation.ai.service.ResponseBuilder;
import com.saho.foundation.dto.ReminderFilterDto;
import com.saho.foundation.dto.ReminderResponseDto;
import com.saho.foundation.service.iservices.ReminderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.StringJoiner;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReminderExportAction implements ReminderAction {

    private final ReminderService reminderService;
    private final ResponseBuilder responseBuilder;
    private final ReminderQuerySupport reminderQuerySupport;

    @Override
    public boolean supports(String action) {
        if (!StringUtils.hasText(action)) {
            return false;
        }

        String normalized = action.trim().toLowerCase();
        return "export".equals(normalized);
    }

    @Override
    public String action() {
        return "export";
    }

    @Override
    public ChatResponse handle(IntentDTO intent, String userMessage) {
        long startedAt = System.nanoTime();
        Map<String, Object> filters = intent != null && intent.getFilters() != null ? intent.getFilters() : Map.of();

        try {
            ReminderActionContext context = reminderQuerySupport.buildActionContext(filters);
            List<ReminderResponseDto> reminders = resolveReminders(context);

            if (reminders.isEmpty()) {
                log.info("Reminder export returned no rows for userMessage='{}'", userMessage);
                return responseBuilder.text("No reminders found to export.");
            }

            List<Integer> reminderIds = reminders.stream()
                .map(ReminderResponseDto::getRemId)
                .filter(java.util.Objects::nonNull)
                .toList();

            Map<String, Object> exportFilters = new LinkedHashMap<>();
            if (StringUtils.hasText(context.search())) {
                exportFilters.put("search", context.search());
            }
            if (StringUtils.hasText(context.status())) {
                exportFilters.put("status", context.status());
            }

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("kind", "reminder_export");
            data.put("fileName", "reminders.csv");
            data.put("filters", exportFilters);
            data.put("reminderIds", reminderIds);
            data.put("count", reminderIds.size());

            ChatResponse response = responseBuilder.download(
                "Export Reminders",
                data,
                buildExportMessage(reminderIds.size(), context)
            );
            log.info("Reminder export prepared {} ids for userMessage='{}'", reminderIds.size(), userMessage);
            return response;
        } catch (IllegalArgumentException ex) {
            log.info("Unsupported reminder export query for userMessage='{}': {}", userMessage, ex.getMessage());
            return responseBuilder.text("I'm sorry, I don't support that reminder query yet.");
        } catch (Exception ex) {
            log.error("Reminder export failed for userMessage='{}'", userMessage, ex);
            return responseBuilder.text("I couldn't retrieve reminder information.");
        } finally {
            long elapsedMs = (System.nanoTime() - startedAt) / 1_000_000;
            log.info("Reminder export action execution time: {} ms for userMessage='{}'", elapsedMs, userMessage);
        }
    }

    private List<ReminderResponseDto> resolveReminders(ReminderActionContext context) {
        ReminderFilterDto filter = ReminderFilterDto.builder()
            .search(context.search())
            .pageNumber(1)
            .pageSize(Integer.MAX_VALUE)
            .status(context.status())
            .build();
        return reminderService.getRemindersAdmin(filter);
    }

    private String buildExportMessage(int count, ReminderActionContext context) {
        StringJoiner joiner = new StringJoiner(", ");
        if (StringUtils.hasText(context.search())) {
            joiner.add(context.search());
        }
        if (StringUtils.hasText(context.status())) {
            joiner.add(context.status());
        }

        String filterSummary = joiner.length() > 0 ? " for " + joiner : "";
        return "I found " + count + " reminders" + filterSummary + ". Your export is downloading now.";
    }
}
