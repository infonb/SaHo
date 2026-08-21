package com.saho.foundation.ai.handler.analytics.graph;

import com.saho.foundation.dto.ReminderResponseDto;
import com.saho.foundation.dto.StudentListResponseDto;
import com.saho.foundation.dto.response.SponsorListResponseDto;
import com.saho.foundation.dto.response.SponsorResponseDto;
import com.saho.foundation.service.iservices.ISponsorService;
import com.saho.foundation.service.iservices.ReminderService;
import com.saho.foundation.service.iservices.StudentService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GraphAnalyticsServiceTest {

    @Mock
    private StudentService studentService;

    @Mock
    private ISponsorService sponsorService;

    @Mock
    private ReminderService reminderService;

    @InjectMocks
    private GraphAnalyticsService graphAnalyticsService;

    private final GraphQuerySupport graphQuerySupport = new GraphQuerySupport();

    @Test
    void buildsGenderDistributionGraphFromStudents() {
        when(studentService.searchStudents(null, null, null, null, null, null, null, false)).thenReturn(List.of(
            student("1"),
            student("2"),
            student("2")
        ));

        GraphQuerySupport.GraphActionContext context = graphQuerySupport.buildActionContext(
            Map.of("graphDataset", "gender_distribution"),
            "Show gender distribution"
        );

        GraphAnalyticsService.GraphResult result = graphAnalyticsService.buildGraph(context);

        assertEquals("Gender Distribution", result.title());
        assertEquals("donut", result.chartType());
        assertEquals(2, result.points().size());
        assertEquals("Male", result.points().get(0).label());
        assertEquals(1L, result.points().get(0).value());
        assertEquals("Female", result.points().get(1).label());
        assertEquals(2L, result.points().get(1).value());
    }

    @Test
    void buildsMonthlySponsorRegistrationsGraphFromSponsors() {
        SponsorResponseDto januarySponsor = new SponsorResponseDto();
        januarySponsor.setCreatedAt(LocalDateTime.of(2026, 1, 5, 10, 0));
        SponsorResponseDto januarySponsorTwo = new SponsorResponseDto();
        januarySponsorTwo.setCreatedAt(LocalDateTime.of(2026, 1, 20, 10, 0));
        SponsorResponseDto februarySponsor = new SponsorResponseDto();
        februarySponsor.setCreatedAt(LocalDateTime.of(2026, 2, 10, 10, 0));

        SponsorListResponseDto sponsorListResponseDto = new SponsorListResponseDto();
        sponsorListResponseDto.setSponsors(List.of(januarySponsor, januarySponsorTwo, februarySponsor));
        when(sponsorService.getAllSponsors(1, Integer.MAX_VALUE, null, null, null, "sponsor_id", "ASC"))
            .thenReturn(sponsorListResponseDto);

        GraphQuerySupport.GraphActionContext context = graphQuerySupport.buildActionContext(
            Map.of("graphDataset", "monthly_sponsor_registrations"),
            "Show monthly sponsor registrations"
        );

        GraphAnalyticsService.GraphResult result = graphAnalyticsService.buildGraph(context);

        assertEquals("Monthly Sponsor Registrations", result.title());
        assertEquals("line", result.chartType());
        assertEquals(2, result.points().size());
        assertEquals("Jan-2026", result.points().get(0).label());
        assertEquals(2L, result.points().get(0).value());
        assertEquals("Feb-2026", result.points().get(1).label());
        assertEquals(1L, result.points().get(1).value());
        assertEquals(2, result.drilldowns().size());
        assertEquals("Show sponsors registered in Jan-2026", result.drilldowns().get(0).prompt());
    }

    @Test
    void buildsReminderStatusDistributionGraphFromReminders() {
        ReminderResponseDto cancelled = new ReminderResponseDto();
        cancelled.setStatus(false);
        ReminderResponseDto upcoming = new ReminderResponseDto();
        upcoming.setStatus(true);
        upcoming.setEventDate(LocalDate.now().plusDays(2));

        when(reminderService.getRemindersAdmin(org.mockito.ArgumentMatchers.any()))
            .thenReturn(List.of(cancelled, upcoming));

        GraphQuerySupport.GraphActionContext context = graphQuerySupport.buildActionContext(
            Map.of("graphDataset", "reminder_status_distribution"),
            "Show reminder status distribution"
        );

        GraphAnalyticsService.GraphResult result = graphAnalyticsService.buildGraph(context);

        assertEquals("Reminder Status Distribution", result.title());
        assertEquals("donut", result.chartType());
        assertEquals(2, result.points().size());
        assertEquals("Upcoming", result.points().get(0).label());
        assertEquals(1L, result.points().get(0).value());
        assertEquals("Cancelled", result.points().get(1).label());
        assertEquals(1L, result.points().get(1).value());
    }

    private StudentListResponseDto student(String gender) {
        return StudentListResponseDto.builder()
            .gender(gender)
            .build();
    }
}
