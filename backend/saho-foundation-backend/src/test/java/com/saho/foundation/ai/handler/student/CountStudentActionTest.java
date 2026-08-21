package com.saho.foundation.ai.handler.student;

import com.saho.foundation.ai.dto.ChatResponse;
import com.saho.foundation.ai.dto.IntentDTO;
import com.saho.foundation.ai.service.ResponseBuilder;
import com.saho.foundation.enums.OrphanStatus;
import com.saho.foundation.service.iservices.StudentService;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

class CountStudentActionTest {

    private final StudentService studentService = mock(StudentService.class);
    private final ResponseBuilder responseBuilder = new ResponseBuilder();
    private final StudentQuerySupport studentQuerySupport = new StudentQuerySupport();
    private final CountStudentAction action = new CountStudentAction(studentService, responseBuilder, studentQuerySupport);

    @Test
    void countsOrphanStudentsUsingOrphanStatusEnumValue() {
        when(studentService.countStudentsByOrphanStatus(OrphanStatus.ORPHAN.getValue())).thenReturn(7L);

        ChatResponse response = action.handle(
            IntentDTO.builder()
                .module("students")
                .action("count")
                .filters(Map.of("orphan", true))
                .responseType("text")
                .reportType(null)
                .build(),
            "How many orphan students are there?"
        );

        assertEquals("text", response.getType());
        assertEquals("There are 7 orphan students.", response.getMessage());
        verify(studentService).countStudentsByOrphanStatus(OrphanStatus.ORPHAN.getValue());
        verifyNoMoreInteractions(studentService);
    }

    @Test
    void countsSemiOrphanStudentsUsingSingleParentEnumValue() {
        when(studentService.countStudentsByOrphanStatus(OrphanStatus.SINGLE_PARENT.getValue())).thenReturn(5L);

        ChatResponse response = action.handle(
            IntentDTO.builder()
                .module("students")
                .action("count")
                .filters(Map.of("semiOrphan", true))
                .responseType("text")
                .reportType(null)
                .build(),
            "How many semi orphan students are there?"
        );

        assertEquals("text", response.getType());
        assertEquals("There are 5 semi orphan students.", response.getMessage());
        verify(studentService).countStudentsByOrphanStatus(OrphanStatus.SINGLE_PARENT.getValue());
        verifyNoMoreInteractions(studentService);
    }
}
