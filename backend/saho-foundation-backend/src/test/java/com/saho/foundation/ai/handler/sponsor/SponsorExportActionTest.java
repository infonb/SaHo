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
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SponsorExportActionTest {

    private final ISponsorService sponsorService = mock(ISponsorService.class);
    private final ResponseBuilder responseBuilder = new ResponseBuilder();
    private final SponsorQuerySupport sponsorQuerySupport = new SponsorQuerySupport();
    private final SponsorExportAction action = new SponsorExportAction(sponsorService, responseBuilder, sponsorQuerySupport);

    @Test
    void returnsDownloadPayloadForMatchingSponsors() {
        SponsorListResponseDto sponsorList = new SponsorListResponseDto();
        sponsorList.setSponsors(List.of(
            sponsor("Sponsor A", "Individual"),
            sponsor("Sponsor B", "Organisation")
        ));

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
                .action("export")
                .filters(Map.of())
                .responseType("excel")
                .build(),
            "Export sponsors"
        );

        assertEquals("download", response.getType());
        assertEquals("Export Sponsors", response.getTitle());
        assertEquals("I found 2 sponsors. Your export is downloading now.", response.getMessage());
        assertTrue(response.getData().containsKey("sponsorIds"));
        assertEquals(List.of(1, 2), response.getData().get("sponsorIds"));
    }

    @Test
    void returnsDownloadPayloadForCreatedMonthFilteredSponsors() {
        SponsorListResponseDto sponsorList = new SponsorListResponseDto();
        SponsorResponseDto janSponsor = sponsor("Sponsor A", "Individual");
        janSponsor.setCreatedAt(java.time.LocalDateTime.of(2026, 1, 10, 10, 0));
        SponsorResponseDto febSponsor = sponsor("Sponsor B", "Organisation");
        febSponsor.setCreatedAt(java.time.LocalDateTime.of(2026, 2, 10, 10, 0));
        sponsorList.setSponsors(List.of(janSponsor, febSponsor));

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
                .action("export")
                .filters(Map.of("createdMonth", "Jan-2026"))
                .responseType("excel")
                .build(),
            "Export sponsors registered in Jan-2026"
        );

        assertEquals("download", response.getType());
        assertEquals("I found 1 sponsors for Jan-2026. Your export is downloading now.", response.getMessage());
        assertEquals(List.of(1), response.getData().get("sponsorIds"));
    }

    private SponsorResponseDto sponsor(String name, String type) {
        SponsorResponseDto sponsor = new SponsorResponseDto();
        sponsor.setSponsorId(List.of("Sponsor A", "Sponsor B").indexOf(name) + 1);
        sponsor.setSponsorName(name);
        sponsor.setSponsorType(type);
        sponsor.setEmail(name.toLowerCase().replace(' ', '.') + "@example.com");
        sponsor.setPhNo("9000000000");
        sponsor.setNationality("Indian");
        sponsor.setContrib("5000");
        sponsor.setLoc("Hyderabad");
        sponsor.setStudentsCount(2);
        return sponsor;
    }
}
