package com.saho.foundation.ai.handler.reminder;

import com.saho.foundation.ai.dto.ChatResponse;
import com.saho.foundation.ai.dto.IntentDTO;
import com.saho.foundation.ai.service.ResponseBuilder;
import com.saho.foundation.dto.ReminderResponseDto;
import com.saho.foundation.service.iservices.ReminderService;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ReminderExportActionTest {

    private final ReminderService reminderService = mock(ReminderService.class);
    private final ResponseBuilder responseBuilder = new ResponseBuilder();
    private final ReminderQuerySupport reminderQuerySupport = new ReminderQuerySupport();
    private final ReminderExportAction action = new ReminderExportAction(reminderService, responseBuilder, reminderQuerySupport);

    @Test
    void returnsDownloadPayloadForReminderExport() {
        when(reminderService.getRemindersAdmin(any())).thenReturn(List.of(
            ReminderResponseDto.builder()
                .remId(1)
                .title("Exam Results")
                .eventDate(LocalDate.of(2026, 10, 12))
                .venue("Hyderabad")
                .status(true)
                .build()
        ));

        ChatResponse response = action.handle(
            IntentDTO.builder()
                .module("reminders")
                .action("export")
                .filters(Map.of())
                .responseType("excel")
                .build(),
            "Export reminders"
        );

        assertEquals("download", response.getType());
        assertEquals("Export Reminders", response.getTitle());
        assertEquals("I found 1 reminders. Your export is downloading now.", response.getMessage());
        assertEquals("reminder_export", response.getData().get("kind"));
        assertEquals("reminders.csv", response.getData().get("fileName"));
    }
}
