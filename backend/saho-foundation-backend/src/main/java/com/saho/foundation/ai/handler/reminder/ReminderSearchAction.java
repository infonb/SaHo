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

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReminderSearchAction implements ReminderAction {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd-MMM-yyyy");
    private static final List<String> TABLE_COLUMNS = List.of(
        "Date",
        "Title",
        "Status",
        "Venue"
    );

    private final ReminderService reminderService;
    private final ResponseBuilder responseBuilder;
    private final ReminderQuerySupport reminderQuerySupport;

    @Override
    public boolean supports(String action) {
        if (!StringUtils.hasText(action)) {
            return false;
        }

        String normalized = action.trim().toLowerCase();
        return "search".equals(normalized)
            || "list".equals(normalized)
            || "show".equals(normalized)
            || "display".equals(normalized)
            || "find".equals(normalized);
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
            ReminderActionContext context = reminderQuerySupport.buildActionContext(filters);
            List<ReminderResponseDto> reminders = resolveReminders(context);

            if (reminders.isEmpty()) {
                log.info("Reminder search returned no rows for userMessage='{}'", userMessage);
                return responseBuilder.text("No reminders found.");
            }

            List<List<String>> rows = reminders.stream()
                .map(this::toTableRow)
                .toList();

            ChatResponse tableResponse = responseBuilder.table("Reminders", TABLE_COLUMNS, rows);
            log.info("ReminderSearchAction final response: {}", tableResponse);
            return tableResponse;
        } catch (IllegalArgumentException ex) {
            log.info("Unsupported reminder query for userMessage='{}': {}", userMessage, ex.getMessage());
            return responseBuilder.text("I'm sorry, I don't support that reminder query yet.");
        } catch (Exception ex) {
            log.error("Reminder search failed for userMessage='{}'", userMessage, ex);
            return responseBuilder.text("I couldn't retrieve reminder information.");
        } finally {
            long elapsedMs = (System.nanoTime() - startedAt) / 1_000_000;
            log.info("Reminder search action execution time: {} ms for userMessage='{}'", elapsedMs, userMessage);
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

    private List<String> toTableRow(ReminderResponseDto reminder) {
        return List.of(
            reminder.getEventDate() != null ? reminder.getEventDate().format(DATE_FORMATTER) : "-",
            normalizeDisplayValue(reminder.getTitle()),
            resolveStatusLabel(reminder),
            normalizeDisplayValue(reminder.getVenue())
        );
    }

    private String resolveStatusLabel(ReminderResponseDto reminder) {
        if (Boolean.FALSE.equals(reminder.getStatus())) {
            return "Cancelled";
        }

        if (reminder.getEventDate() == null) {
            return "Upcoming";
        }

        LocalDate today = LocalDate.now();
        if (reminder.getEventDate().isAfter(today)) {
            return "Upcoming";
        }
        if (reminder.getEventDate().isEqual(today)) {
            return "Ongoing";
        }
        return "Completed";
    }

    private String normalizeDisplayValue(String value) {
        return StringUtils.hasText(value) ? value.trim() : "-";
    }
}
