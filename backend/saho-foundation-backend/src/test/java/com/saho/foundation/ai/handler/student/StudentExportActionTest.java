package com.saho.foundation.ai.handler.student;

import com.saho.foundation.ai.dto.ChatResponse;
import com.saho.foundation.ai.dto.IntentDTO;
import com.saho.foundation.ai.service.ResponseBuilder;
import com.saho.foundation.dto.StudentListResponseDto;
import com.saho.foundation.service.iservices.StudentService;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class StudentExportActionTest {

    private final StudentService studentService = mock(StudentService.class);
    private final ResponseBuilder responseBuilder = new ResponseBuilder();
    private final StudentQuerySupport studentQuerySupport = new StudentQuerySupport();
    private final StudentExportAction action = new StudentExportAction(studentService, responseBuilder, studentQuerySupport);

    @Test
    void returnsDownloadPayloadForMatchingStudents() {
        when(studentService.searchStudents(
            isNull(),
            isNull(),
            isNull(),
            isNull(),
            isNull(),
            isNull(),
            isNull(),
            eq(false)
        )).thenReturn(List.of(
            StudentListResponseDto.builder().studentId(11).name("Asha").build(),
            StudentListResponseDto.builder().studentId(12).name("Rahul").build()
        ));

        ChatResponse response = action.handle(
            IntentDTO.builder()
                .module("students")
                .action("export")
                .filters(Map.of())
                .responseType("excel")
                .build(),
            "Export them"
        );

        assertEquals("download", response.getType());
        assertEquals("Export Students", response.getTitle());
        assertEquals("I found 2 students. Your export is downloading now.", response.getMessage());
        assertTrue(response.getData().containsKey("studentIds"));
        assertEquals(List.of(11, 12), response.getData().get("studentIds"));
    }

    @Test
    void usesSponsorAwareLookupWhenSponsorNameIsPresent() {
        when(studentService.searchStudentsBySponsorName(
            eq("Sponsor XYZ"),
            isNull(),
            isNull(),
            isNull(),
            isNull(),
            isNull(),
            isNull(),
            isNull(),
            eq(false)
        )).thenReturn(List.of(
            StudentListResponseDto.builder().studentId(21).name("Anu").build()
        ));

        ChatResponse response = action.handle(
            IntentDTO.builder()
                .module("students")
                .action("export")
                .filters(Map.of("sponsorName", "Sponsor XYZ"))
                .responseType("excel")
                .build(),
            "Export students assigned to Sponsor XYZ"
        );

        assertEquals("download", response.getType());
        assertEquals(List.of(21), response.getData().get("studentIds"));
    }
}
