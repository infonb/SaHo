package com.saho.foundation.ai.handler.student;

import com.saho.foundation.ai.dto.ChatResponse;
import com.saho.foundation.ai.dto.IntentDTO;
import com.saho.foundation.ai.service.ResponseBuilder;
import com.saho.foundation.dto.StudentDetailsResponseDto;
import com.saho.foundation.service.iservices.StudentService;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StudentDetailsActionTest {

    private final StudentService studentService = mock(StudentService.class);
    private final ResponseBuilder responseBuilder = new ResponseBuilder();
    private final StudentQuerySupport studentQuerySupport = new StudentQuerySupport();
    private final StudentDetailsAction action = new StudentDetailsAction(studentService, responseBuilder, studentQuerySupport);

    @Test
    void returnsStudentCardForKnownName() {
        StudentDetailsResponseDto details = StudentDetailsResponseDto.builder()
            .studentName("Asha")
            .gender("2")
            .dob(LocalDate.of(2012, 1, 1))
            .className("Class 8")
            .schoolName("Green Valley School")
            .guardianName("Lakshmi")
            .phone("9000000000")
            .email("asha@example.com")
            .bloodGroup("O+")
            .religion("1")
            .caste("SC")
            .orphanStatus("3")
            .sponsor("Sponsor XYZ")
            .build();

        when(studentService.getStudentDetailsByName("Asha")).thenReturn(Optional.of(details));

        ChatResponse response = action.handle(
            IntentDTO.builder()
                .module("students")
                .action("details")
                .filters(Map.of("studentName", "Asha"))
                .responseType("card")
                .build(),
            "Show details of Asha"
        );

        assertEquals("card", response.getType());
        assertEquals("Student Details", response.getTitle());
        assertEquals("Asha", response.getData().get("Student Name"));
        assertEquals("Female", response.getData().get("Gender"));
        assertEquals("Hindu", response.getData().get("Religion"));
        assertEquals("Orphan", response.getData().get("Orphan Status"));
        assertEquals("Green Valley School", response.getData().get("School"));
        assertEquals("Lakshmi", response.getData().get("Guardian"));
        verify(studentService).getStudentDetailsByName("Asha");
    }

    @Test
    void returnsFriendlyMessageWhenStudentNameMissing() {
        ChatResponse response = action.handle(
            IntentDTO.builder()
                .module("students")
                .action("details")
                .filters(Map.of())
                .responseType("card")
                .build(),
            "Show student details"
        );

        assertEquals("text", response.getType());
        assertEquals("No student found with the given name.", response.getMessage());
    }
}
