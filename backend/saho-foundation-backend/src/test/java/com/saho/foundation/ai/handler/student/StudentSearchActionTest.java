package com.saho.foundation.ai.handler.student;

import com.saho.foundation.ai.dto.ChatResponse;
import com.saho.foundation.ai.dto.IntentDTO;
import com.saho.foundation.ai.service.ResponseBuilder;
import com.saho.foundation.dto.StudentListResponseDto;
import com.saho.foundation.dto.StudentPaginationResponseDto;
import com.saho.foundation.service.iservices.StudentService;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StudentSearchActionTest {

    private final StudentService studentService = mock(StudentService.class);
    private final ResponseBuilder responseBuilder = new ResponseBuilder();
    private final StudentQuerySupport studentQuerySupport = new StudentQuerySupport();
    private final StudentSearchAction action = new StudentSearchAction(studentService, responseBuilder, studentQuerySupport);

    @Test
    void returnsTableForShowAllStudentsQuery() {
        StudentPaginationResponseDto paginationResponse = StudentPaginationResponseDto.builder()
            .students(List.of(
                StudentListResponseDto.builder()
                    .studentId(1)
                    .name("Asha")
                    .gender("Female")
                    .schName("Green Valley School")
                    .className("Class 8")
                    .guardianName("Lakshmi")
                    .dob(LocalDate.of(2012, 1, 1))
                    .build()
            ))
            .build();

        when(studentService.searchStudents(
            isNull(),
            isNull(),
            isNull(),
            isNull(),
            isNull(),
            isNull(),
            isNull(),
            eq(false)
        )).thenReturn(paginationResponse.getStudents());

        ChatResponse response = action.handle(
            IntentDTO.builder()
                .module("students")
                .action("search")
                .filters(Map.of())
                .responseType("table")
                .build(),
            "Show all students"
        );

        assertEquals("table", response.getType());
        assertEquals("Students", response.getTitle());
        assertEquals(List.of("Student Name", "Gender", "School", "Class", "Guardian"), response.getColumns());
        assertEquals(List.of(List.of("Asha", "Female", "Green Valley School", "Class 8", "Lakshmi")), response.getRows());
        assertNull(response.getMessage());
    }

    @Test
    void mapsGenderAndOrphanFiltersUsingExistingServiceCall() {
        StudentPaginationResponseDto paginationResponse = StudentPaginationResponseDto.builder()
            .students(List.of())
            .build();

        when(studentService.searchStudents(
            isNull(),
            isNull(),
            isNull(),
            isNull(),
            eq("2"),
            isNull(),
            eq("3"),
            eq(false)
        )).thenReturn(paginationResponse.getStudents());

        ChatResponse response = action.handle(
            IntentDTO.builder()
                .module("students")
                .action("search")
                .filters(Map.of("gender", "female", "orphan", true))
                .responseType("table")
                .build(),
            "Show female orphan students"
        );

        assertEquals("text", response.getType());
        assertEquals("No students found.", response.getMessage());
        verify(studentService).searchStudents(
            null,
            null,
            null,
            null,
            "2",
            null,
            "3",
            false
        );
    }

    @Test
    void filtersStudentsBySchoolNameAfterServiceLookup() {
        StudentPaginationResponseDto paginationResponse = StudentPaginationResponseDto.builder()
            .students(List.of(
                StudentListResponseDto.builder()
                    .studentId(1)
                    .name("Asha")
                    .gender("Female")
                    .schName("Green Valley School")
                    .className("Class 8")
                    .guardianName("Lakshmi")
                    .build()
            ))
            .build();

        when(studentService.searchStudents(
            isNull(),
            eq("Green"),
            isNull(),
            isNull(),
            isNull(),
            isNull(),
            isNull(),
            eq(false)
        )).thenReturn(paginationResponse.getStudents());

        ChatResponse response = action.handle(
            IntentDTO.builder()
                .module("students")
                .action("search")
                .filters(Map.of("schoolName", "Green"))
                .responseType("table")
                .build(),
            "Show students from Green school"
        );

        assertEquals(1, response.getRows().size());
        assertEquals(List.of("Asha", "Female", "Green Valley School", "Class 8", "Lakshmi"), response.getRows().get(0));
        verify(studentService).searchStudents(
            null,
            "Green",
            null,
            null,
            null,
            null,
            null,
            false
        );
    }

    @Test
    void returnsNoStudentsFoundWhenSearchResultIsEmpty() {
        StudentPaginationResponseDto paginationResponse = StudentPaginationResponseDto.builder()
            .students(List.of())
            .build();

        when(studentService.searchStudents(
            isNull(),
            isNull(),
            isNull(),
            isNull(),
            isNull(),
            isNull(),
            isNull(),
            eq(false)
        )).thenReturn(paginationResponse.getStudents());

        ChatResponse response = action.handle(
            IntentDTO.builder()
                .module("students")
                .action("search")
                .filters(Map.of())
                .responseType("table")
                .build(),
            "Show all students"
        );

        assertEquals("text", response.getType());
        assertEquals("No students found.", response.getMessage());
    }

    @Test
    void routesSponsorNameQueriesThroughSponsorAwareLookup() {
        StudentPaginationResponseDto paginationResponse = StudentPaginationResponseDto.builder()
            .students(List.of(
                StudentListResponseDto.builder()
                    .studentId(1)
                    .name("Asha")
                    .gender("Female")
                    .schName("Green Valley School")
                    .className("Class 8")
                    .guardianName("Lakshmi")
                    .sponsorName("Sponsor XYZ")
                    .build()
            ))
            .build();

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
        )).thenReturn(paginationResponse.getStudents());

        ChatResponse response = action.handle(
            IntentDTO.builder()
                .module("students")
                .action("search")
                .filters(Map.of("sponsorName", "Sponsor XYZ"))
                .responseType("table")
                .build(),
            "Show students assigned to Sponsor XYZ"
        );

        assertEquals(1, response.getRows().size());
        assertEquals(List.of("Asha", "Female", "Green Valley School", "Class 8", "Lakshmi"), response.getRows().get(0));
        verify(studentService).searchStudentsBySponsorName(
            "Sponsor XYZ",
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            false
        );
    }
}
