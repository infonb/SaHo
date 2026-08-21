package com.saho.foundation.ai.service;

import com.saho.foundation.ai.dto.IntentDTO;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ConversationMemoryServiceTest {

    private final ConversationMemoryService memoryService = new ConversationMemoryService();

    @Test
    void mergesFollowUpFiltersIntoPreviousStudentContext() {
        String sessionId = "session-1";

        memoryService.remember(
            sessionId,
            "Show sponsored students",
            IntentDTO.builder()
                .module("students")
                .action("search")
                .filters(Map.of("sponsored", true))
                .responseType("table")
                .build()
        );

        IntentDTO merged = memoryService.applyContext(
            sessionId,
            "Only girls",
            IntentDTO.builder()
                .module("students")
                .action("search")
                .filters(Map.of("gender", "female"))
                .responseType("table")
                .build()
        ).orElseThrow();

        assertEquals("students", merged.getModule());
        assertEquals("search", merged.getAction());
        assertEquals(true, merged.getFilters().get("sponsored"));
        assertEquals("female", merged.getFilters().get("gender"));
    }

    @Test
    void doesNotMergeWhenExplicitModuleMentionIsPresent() {
        String sessionId = "session-2";

        memoryService.remember(
            sessionId,
            "Show sponsored students",
            IntentDTO.builder()
                .module("students")
                .action("search")
                .filters(Map.of("sponsored", true))
                .responseType("table")
                .build()
        );

        IntentDTO result = memoryService.applyContext(
            sessionId,
            "Show female students",
            IntentDTO.builder()
                .module("students")
                .action("search")
                .filters(Map.of("gender", "female"))
                .responseType("table")
                .build()
        ).orElseThrow();

        assertEquals("female", result.getFilters().get("gender"));
        assertEquals(null, result.getFilters().get("sponsored"));
    }

    @Test
    void exportsThemFollowPreviousSponsorContext() {
        String sessionId = "session-3";

        memoryService.remember(
            sessionId,
            "Show sponsors from India",
            IntentDTO.builder()
                .module("sponsors")
                .action("search")
                .filters(Map.of("nationality", "Indian"))
                .responseType("table")
                .build()
        );

        IntentDTO merged = memoryService.applyContext(
            sessionId,
            "Export them",
            IntentDTO.builder()
                .module("students")
                .action("export")
                .filters(Map.of())
                .responseType("excel")
                .build()
        ).orElseThrow();

        assertEquals("sponsors", merged.getModule());
        assertEquals("export", merged.getAction());
        assertEquals("Indian", merged.getFilters().get("nationality"));
    }
}
