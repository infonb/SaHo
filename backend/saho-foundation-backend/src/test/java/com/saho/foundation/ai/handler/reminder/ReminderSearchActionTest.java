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

class ReminderSearchActionTest {

    private final ReminderService reminderService = mock(ReminderService.class);
    private final ResponseBuilder responseBuilder = new ResponseBuilder();
    private final ReminderQuerySupport reminderQuerySupport = new ReminderQuerySupport();
    private final ReminderSearchAction action = new ReminderSearchAction(reminderService, responseBuilder, reminderQuerySupport);

    @Test
    void returnsTableForAllReminders() {
        when(reminderService.getRemindersAdmin(any())).thenReturn(List.of(
            ReminderResponseDto.builder()
                .remId(1)
                .title("Parent Meeting")
                .eventDate(LocalDate.now().plusDays(1))
                .venue("Main Hall")
                .status(true)
                .build()
        ));

        ChatResponse response = action.handle(
            IntentDTO.builder()
                .module("reminders")
                .action("search")
                .filters(Map.of())
                .responseType("table")
                .build(),
            "Show all reminders"
        );

        assertEquals("table", response.getType());
        assertEquals("Reminders", response.getTitle());
        assertEquals(List.of("Date", "Title", "Status", "Venue"), response.getColumns());
        assertEquals(1, response.getRows().size());
        assertEquals("Upcoming", response.getRows().get(0).get(2));
    }

    @Test
    void returnsCancelledStatusForCancelledReminders() {
        when(reminderService.getRemindersAdmin(any())).thenReturn(List.of(
            ReminderResponseDto.builder()
                .remId(2)
                .title("Cancelled Event")
                .eventDate(LocalDate.now().minusDays(1))
                .venue("Auditorium")
                .status(false)
                .build()
        ));

        ChatResponse response = action.handle(
            IntentDTO.builder()
                .module("reminders")
                .action("search")
                .filters(Map.of("status", "cancelled"))
                .responseType("table")
                .build(),
            "Show cancelled reminders"
        );

        assertEquals("Cancelled", response.getRows().get(0).get(2));
    }
}
