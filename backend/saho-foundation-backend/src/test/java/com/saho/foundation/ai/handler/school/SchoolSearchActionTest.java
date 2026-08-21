package com.saho.foundation.ai.handler.school;

import com.saho.foundation.ai.dto.ChatResponse;
import com.saho.foundation.ai.dto.IntentDTO;
import com.saho.foundation.ai.service.ResponseBuilder;
import com.saho.foundation.entity.SchoolMaster;
import com.saho.foundation.service.iservices.LocationService;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SchoolSearchActionTest {

    private final LocationService locationService = mock(LocationService.class);
    private final ResponseBuilder responseBuilder = new ResponseBuilder();
    private final SchoolQuerySupport schoolQuerySupport = new SchoolQuerySupport();
    private final SchoolSearchAction action = new SchoolSearchAction(locationService, responseBuilder, schoolQuerySupport);

    @Test
    void returnsTableForShowAllSchools() {
        when(locationService.getAllSchools()).thenReturn(List.of(
            SchoolMaster.builder()
                .schId(1)
                .schName("ZPHS TN Peta")
                .schAddress("Main Road")
                .vilId(10)
                .build()
        ));

        ChatResponse response = action.handle(
            IntentDTO.builder()
                .module("schools")
                .action("search")
                .filters(Map.of())
                .responseType("table")
                .build(),
            "Show all schools"
        );

        assertEquals("table", response.getType());
        assertEquals("Schools", response.getTitle());
        assertEquals(List.of("School Name", "Address", "Village ID"), response.getColumns());
        assertEquals(List.of(List.of("ZPHS TN Peta", "Main Road", "10")), response.getRows());
    }

    @Test
    void filtersSchoolsBySearchTerm() {
        when(locationService.getAllSchools()).thenReturn(List.of(
            SchoolMaster.builder()
                .schId(1)
                .schName("ZPHS TN Peta")
                .schAddress("Main Road")
                .vilId(10)
                .build(),
            SchoolMaster.builder()
                .schId(2)
                .schName("Government High School")
                .schAddress("Town Center")
                .vilId(11)
                .build()
        ));

        ChatResponse response = action.handle(
            IntentDTO.builder()
                .module("schools")
                .action("search")
                .filters(Map.of("schoolName", "Government"))
                .responseType("table")
                .build(),
            "List schools in Government"
        );

        assertEquals(1, response.getRows().size());
        assertEquals(List.of("Government High School", "Town Center", "11"), response.getRows().get(0));
    }
}
