package com.saho.foundation.ai.handler.sponsor;

import com.saho.foundation.ai.dto.ChatResponse;
import com.saho.foundation.ai.dto.IntentDTO;
import com.saho.foundation.ai.service.ResponseBuilder;
import com.saho.foundation.dto.response.SponsorListResponseDto;
import com.saho.foundation.dto.response.SponsorResponseDto;
import com.saho.foundation.service.iservices.ISponsorService;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SponsorSearchActionTest {

    private final ISponsorService sponsorService = mock(ISponsorService.class);
    private final ResponseBuilder responseBuilder = new ResponseBuilder();
    private final SponsorQuerySupport sponsorQuerySupport = new SponsorQuerySupport();
    private final SponsorSearchAction action = new SponsorSearchAction(sponsorService, responseBuilder, sponsorQuerySupport);

    @Test
    void returnsSponsorTableForShowAllSponsors() {
        SponsorResponseDto sponsor = new SponsorResponseDto();
        sponsor.setSponsorId(1);
        sponsor.setSponsorName("Sponsor XYZ");
        sponsor.setNationality("Indian");
        sponsor.setSponsorType("Organisation");
        sponsor.setEmail("xyz@example.com");
        sponsor.setPhNo("9999999999");
        sponsor.setLoc("Hyderabad");
        sponsor.setStudentsCount(4);

        SponsorListResponseDto sponsorList = new SponsorListResponseDto();
        sponsorList.setPageNumber(1);
        sponsorList.setPageSize(100);
        sponsorList.setTotalCount(1);
        sponsorList.setItemCount(1);
        sponsorList.setSponsors(List.of(sponsor));

        when(sponsorService.getAllSponsors(
            eq(1),
            eq(Integer.MAX_VALUE),
            isNull(),
            isNull(),
            isNull(),
            eq("sponsor_id"),
            eq("ASC"),
            isNull()
        )).thenReturn(sponsorList);

        ChatResponse response = action.handle(
            IntentDTO.builder()
                .module("sponsors")
                .action("search")
                .filters(Map.of())
                .responseType("table")
                .build(),
            "Show all sponsors"
        );

        assertEquals("table", response.getType());
        assertEquals("Sponsors", response.getTitle());
        assertEquals(List.of("Sponsor Name", "Type", "Nationality", "Email", "Phone", "Location", "Students"), response.getColumns());
        assertEquals(List.of(List.of("Sponsor XYZ", "Organisation", "Indian", "xyz@example.com", "9999999999", "Hyderabad", "4")), response.getRows());
        verify(sponsorService).getAllSponsors(
            1,
            Integer.MAX_VALUE,
            null,
            null,
            null,
            "sponsor_id",
            "ASC",
            null
        );
    }

    @Test
    void routesSponsorNameAndTypeFiltersToSponsorSearch() {
        SponsorResponseDto sponsor = new SponsorResponseDto();
        sponsor.setSponsorId(1);
        sponsor.setSponsorName("Sponsor XYZ");
        sponsor.setNationality("Indian");
        sponsor.setSponsorType("Individual");
        sponsor.setEmail("xyz@example.com");
        sponsor.setPhNo("9999999999");
        sponsor.setLoc("Hyderabad");
        sponsor.setStudentsCount(2);

        SponsorListResponseDto sponsorList = new SponsorListResponseDto();
        sponsorList.setSponsors(List.of(sponsor));

        when(sponsorService.getAllSponsors(
            eq(1),
            eq(Integer.MAX_VALUE),
            eq("Sponsor XYZ"),
            eq("Individual"),
            eq("Indian"),
            eq("sponsor_id"),
            eq("ASC"),
            isNull()
        )).thenReturn(sponsorList);

        ChatResponse response = action.handle(
            IntentDTO.builder()
                .module("sponsors")
                .action("search")
                .filters(Map.of(
                    "sponsorName", "Sponsor XYZ",
                    "type", "Individual",
                    "nationality", "Indian"
                ))
                .responseType("table")
                .build(),
            "Show Sponsor XYZ sponsors"
        );

        assertEquals(1, response.getRows().size());
        assertEquals(List.of("Sponsor XYZ", "Individual", "Indian", "xyz@example.com", "9999999999", "Hyderabad", "2"), response.getRows().get(0));
    }

    @Test
    void filtersSponsorsByCreatedMonthWhenPresent() {
        SponsorResponseDto januarySponsor = new SponsorResponseDto();
        januarySponsor.setSponsorId(1);
        januarySponsor.setSponsorName("January Sponsor");
        januarySponsor.setSponsorType("Individual");
        januarySponsor.setNationality("Indian");
        januarySponsor.setCreatedAt(java.time.LocalDateTime.of(2026, 1, 10, 10, 0));

        SponsorResponseDto februarySponsor = new SponsorResponseDto();
        februarySponsor.setSponsorId(2);
        februarySponsor.setSponsorName("February Sponsor");
        februarySponsor.setSponsorType("Organisation");
        februarySponsor.setNationality("Indian");
        februarySponsor.setCreatedAt(java.time.LocalDateTime.of(2026, 2, 10, 10, 0));

        SponsorListResponseDto sponsorList = new SponsorListResponseDto();
        sponsorList.setSponsors(List.of(januarySponsor, februarySponsor));

        when(sponsorService.getAllSponsors(
            eq(1),
            eq(Integer.MAX_VALUE),
            isNull(),
            isNull(),
            isNull(),
            eq("sponsor_id"),
            eq("ASC"),
            eq("Jan-2026")
        )).thenReturn(sponsorList);

        ChatResponse response = action.handle(
            IntentDTO.builder()
                .module("sponsors")
                .action("search")
                .filters(Map.of("createdMonth", "Jan-2026"))
                .responseType("table")
                .build(),
            "Show sponsors registered in Jan-2026"
        );

        assertEquals(1, response.getRows().size());
        assertEquals("January Sponsor", response.getRows().get(0).get(0));
    }
}
