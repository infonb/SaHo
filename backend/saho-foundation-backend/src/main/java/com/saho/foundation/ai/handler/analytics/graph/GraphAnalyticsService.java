package com.saho.foundation.ai.handler.analytics.graph;

import com.saho.foundation.dto.ReminderFilterDto;
import com.saho.foundation.dto.ReminderResponseDto;
import com.saho.foundation.dto.StudentListResponseDto;
import com.saho.foundation.dto.response.SponsorListResponseDto;
import com.saho.foundation.dto.response.SponsorResponseDto;
import com.saho.foundation.enums.Gender;
import com.saho.foundation.enums.OrphanStatus;
import com.saho.foundation.service.iservices.ISponsorService;
import com.saho.foundation.service.iservices.ReminderService;
import com.saho.foundation.service.iservices.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GraphAnalyticsService {

    private static final DateTimeFormatter MONTH_LABEL = DateTimeFormatter.ofPattern("MMM-yyyy", Locale.ENGLISH);

    private final StudentService studentService;
    private final ISponsorService sponsorService;
    private final ReminderService reminderService;

    public GraphResult buildGraph(GraphQuerySupport.GraphActionContext context) {
        return switch (context.datasetKey()) {
            case "gender_distribution" -> buildGenderDistribution(context);
            case "district_student_count" -> buildDistrictStudentCount(context);
            case "state_orphan_students" -> buildStateOrphanStudents(context);
            case "monthly_sponsor_registrations" -> buildMonthlySponsorRegistrations(context);
            case "reminder_status_distribution" -> buildReminderStatusDistribution(context);
            case "school_student_count" -> buildSchoolStudentCount(context);
            case "age_distribution" -> buildAgeDistribution(context);
            case "sponsorship_trends" -> buildSponsorshipTrends(context);
            default -> GraphResult.empty(context.title(), context.chartType(), context.xAxis(), context.yAxis(), context.seriesLabel());
        };
    }

    private GraphResult buildGenderDistribution(GraphQuerySupport.GraphActionContext context) {
        List<StudentListResponseDto> students = loadStudents();
        Map<String, Long> counts = students.stream()
            .map(student -> normalizeGender(student.getGender()))
            .filter(StringUtils::hasText)
            .collect(Collectors.groupingBy(value -> value, LinkedHashMap::new, Collectors.counting()));

        return toResult(context, orderCounts(counts, List.of("Male", "Female", "Other")), buildGenderDrilldowns());
    }

    private GraphResult buildDistrictStudentCount(GraphQuerySupport.GraphActionContext context) {
        List<StudentListResponseDto> students = loadStudents();
        Map<String, Long> counts = students.stream()
            .map(StudentListResponseDto::getDistName)
            .map(this::normalizeLabel)
            .collect(Collectors.groupingBy(value -> value, Collectors.counting()));

        return toResult(context, topCounts(counts, 10), buildDistrictDrilldowns(counts));
    }

    private GraphResult buildStateOrphanStudents(GraphQuerySupport.GraphActionContext context) {
        List<StudentListResponseDto> students = loadStudents();
        Map<String, Long> counts = students.stream()
            .filter(student -> isOrphan(student.getOrphanStatus()))
            .map(StudentListResponseDto::getStName)
            .map(this::normalizeLabel)
            .collect(Collectors.groupingBy(value -> value, Collectors.counting()));

        return toResult(context, topCounts(counts, 10), buildStateDrilldowns(counts));
    }

    private GraphResult buildMonthlySponsorRegistrations(GraphQuerySupport.GraphActionContext context) {
        List<SponsorResponseDto> sponsors = loadSponsors();
        Map<String, Long> counts = sponsors.stream()
            .map(this::resolveCreatedAt)
            .filter(Objects::nonNull)
            .collect(Collectors.groupingBy(
                createdAt -> YearMonth.from(createdAt).format(MONTH_LABEL),
                LinkedHashMap::new,
                Collectors.counting()
            ));

        Map<String, Long> orderedCounts = sortByYearMonth(counts);
        return toResult(context, orderedCounts, buildSponsorMonthDrilldowns(orderedCounts));
    }

    private GraphResult buildReminderStatusDistribution(GraphQuerySupport.GraphActionContext context) {
        List<ReminderResponseDto> reminders = loadReminders();
        Map<String, Long> counts = reminders.stream()
            .map(this::resolveReminderStatusLabel)
            .collect(Collectors.groupingBy(value -> value, LinkedHashMap::new, Collectors.counting()));

        return toResult(context, orderCounts(counts, List.of("Upcoming", "Ongoing", "Completed", "Cancelled")), buildReminderDrilldowns());
    }

    private GraphResult buildSchoolStudentCount(GraphQuerySupport.GraphActionContext context) {
        List<StudentListResponseDto> students = loadStudents();
        Map<String, Long> counts = students.stream()
            .map(StudentListResponseDto::getSchName)
            .map(this::normalizeLabel)
            .collect(Collectors.groupingBy(value -> value, Collectors.counting()));

        return toResult(context, topCounts(counts, 10), buildSchoolDrilldowns(counts));
    }

    private GraphResult buildAgeDistribution(GraphQuerySupport.GraphActionContext context) {
        List<StudentListResponseDto> students = loadStudents();
        Map<String, Long> counts = students.stream()
            .map(StudentListResponseDto::getDob)
            .map(this::resolveAgeGroup)
            .filter(StringUtils::hasText)
            .collect(Collectors.groupingBy(value -> value, LinkedHashMap::new, Collectors.counting()));

        List<String> orderedGroups = List.of("10-11", "12-13", "14-15", "16+");
        return toResult(context, orderCounts(counts, orderedGroups), List.of());
    }

    private GraphResult buildSponsorshipTrends(GraphQuerySupport.GraphActionContext context) {
        List<SponsorResponseDto> sponsors = loadSponsors();
        Map<String, Long> counts = sponsors.stream()
            .map(this::resolveCreatedAt)
            .filter(Objects::nonNull)
            .collect(Collectors.groupingBy(
                createdAt -> YearMonth.from(createdAt).format(MONTH_LABEL),
                LinkedHashMap::new,
                Collectors.counting()
            ));

        Map<String, Long> orderedCounts = sortByYearMonth(counts);
        return toResult(context, orderedCounts, buildSponsorMonthDrilldowns(orderedCounts));
    }

    private List<StudentListResponseDto> loadStudents() {
        List<StudentListResponseDto> students = studentService.searchStudents(null, null, null, null, null, null, null, false);
        return students != null ? students : List.of();
    }

    private List<SponsorResponseDto> loadSponsors() {
        SponsorListResponseDto response = sponsorService.getAllSponsors(1, Integer.MAX_VALUE, null, null, null, "sponsor_id", "ASC");
        return response != null && response.getSponsors() != null ? response.getSponsors() : List.of();
    }

    private LocalDateTime resolveCreatedAt(SponsorResponseDto sponsor) {
        if (sponsor == null) {
            return null;
        }

        try {
            Method getter = sponsor.getClass().getMethod("getCreatedAt");
            Object value = getter.invoke(sponsor);
            if (value instanceof LocalDateTime localDateTime) {
                return localDateTime;
            }
        } catch (Exception ignored) {
            // If the runtime DTO is older than the source, keep the graph safe and empty.
        }

        return null;
    }

    private List<ReminderResponseDto> loadReminders() {
        ReminderFilterDto filter = ReminderFilterDto.builder()
            .pageNumber(1)
            .pageSize(Integer.MAX_VALUE)
            .build();
        List<ReminderResponseDto> reminders = reminderService.getRemindersAdmin(filter);
        return reminders != null ? reminders : List.of();
    }

    private GraphResult toResult(GraphQuerySupport.GraphActionContext context, Map<String, Long> counts, List<GraphDrilldown> drilldowns) {
        List<GraphPoint> points = counts.entrySet().stream()
            .map(entry -> new GraphPoint(entry.getKey(), entry.getValue()))
            .toList();
        return new GraphResult(context.title(), context.chartType(), context.xAxis(), context.yAxis(), context.seriesLabel(), points, drilldowns);
    }

    private List<GraphDrilldown> buildGenderDrilldowns() {
        return List.of(
            new GraphDrilldown("Male", "Show male students"),
            new GraphDrilldown("Female", "Show female students"),
            new GraphDrilldown("Other", "Show other students")
        );
    }

    private List<GraphDrilldown> buildReminderDrilldowns() {
        return List.of(
            new GraphDrilldown("Upcoming", "Show upcoming reminders"),
            new GraphDrilldown("Ongoing", "Show ongoing reminders"),
            new GraphDrilldown("Completed", "Show completed reminders"),
            new GraphDrilldown("Cancelled", "Show cancelled reminders")
        );
    }

    private List<GraphDrilldown> buildSchoolDrilldowns(Map<String, Long> counts) {
        return counts.keySet().stream()
            .filter(StringUtils::hasText)
            .map(label -> new GraphDrilldown(label, "Show students studying in " + label))
            .toList();
    }

    private List<GraphDrilldown> buildSponsorMonthDrilldowns(Map<String, Long> counts) {
        return counts.keySet().stream()
            .filter(StringUtils::hasText)
            .map(label -> new GraphDrilldown(label, "Show sponsors registered in " + label))
            .toList();
    }

    private List<GraphDrilldown> buildDistrictDrilldowns(Map<String, Long> counts) {
        return counts.keySet().stream()
            .filter(StringUtils::hasText)
            .map(label -> new GraphDrilldown(label, "Show students from " + label + " district"))
            .toList();
    }

    private List<GraphDrilldown> buildStateDrilldowns(Map<String, Long> counts) {
        return counts.keySet().stream()
            .filter(StringUtils::hasText)
            .map(label -> new GraphDrilldown(label, "Show orphan students from " + label + " state"))
            .toList();
    }

    private Map<String, Long> orderCounts(Map<String, Long> counts, List<String> preferredOrder) {
        LinkedHashMap<String, Long> ordered = new LinkedHashMap<>();
        for (String label : preferredOrder) {
            if (counts.containsKey(label)) {
                ordered.put(label, counts.get(label));
            }
        }
        counts.entrySet().stream()
            .filter(entry -> !ordered.containsKey(entry.getKey()))
            .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder()).thenComparing(Map.Entry::getKey))
            .forEach(entry -> ordered.put(entry.getKey(), entry.getValue()));
        return ordered;
    }

    private Map<String, Long> topCounts(Map<String, Long> counts, int maxItems) {
        List<Map.Entry<String, Long>> sorted = counts.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder()).thenComparing(Map.Entry::getKey))
            .toList();

        LinkedHashMap<String, Long> ordered = new LinkedHashMap<>();
        long otherTotal = 0;
        for (int i = 0; i < sorted.size(); i++) {
            Map.Entry<String, Long> entry = sorted.get(i);
            if (i < maxItems) {
                ordered.put(entry.getKey(), entry.getValue());
            } else {
                otherTotal += entry.getValue();
            }
        }
        if (otherTotal > 0) {
            ordered.put("Others", otherTotal);
        }
        return ordered;
    }

    private Map<String, Long> sortByYearMonth(Map<String, Long> counts) {
        return counts.entrySet().stream()
            .sorted(Comparator.comparing(entry -> YearMonth.parse(entry.getKey(), MONTH_LABEL)))
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                Map.Entry::getValue,
                (left, right) -> left,
                LinkedHashMap::new
            ));
    }

    private String normalizeGender(String value) {
        if (!StringUtils.hasText(value)) {
            return "Unknown";
        }
        String label = Gender.getLabelByValue(value.trim());
        if (StringUtils.hasText(label)) {
            return label;
        }
        return value.trim();
    }

    private String normalizeLabel(String value) {
        return StringUtils.hasText(value) ? value.trim() : "Unknown";
    }

    private boolean isOrphan(String orphanStatus) {
        if (!StringUtils.hasText(orphanStatus)) {
            return false;
        }
        return OrphanStatus.ORPHAN.getValue().equals(orphanStatus.trim());
    }

    private String resolveAgeGroup(LocalDate dob) {
        if (dob == null) {
            return null;
        }
        int age = java.time.Period.between(dob, LocalDate.now()).getYears();
        if (age <= 11) {
            return "10-11";
        }
        if (age <= 13) {
            return "12-13";
        }
        if (age <= 15) {
            return "14-15";
        }
        return "16+";
    }

    private String resolveReminderStatusLabel(ReminderResponseDto reminder) {
        if (Boolean.FALSE.equals(reminder.getStatus())) {
            return "Cancelled";
        }
        if (reminder.getEventDate() == null) {
            return "Upcoming";
        }
        LocalDate today = LocalDate.now();
        if (reminder.getEventDate().isAfter(today)) {
            return "Upcoming";
        }
        if (reminder.getEventDate().isEqual(today)) {
            return "Ongoing";
        }
        return "Completed";
    }

    public record GraphPoint(String label, Number value) {
    }

    public record GraphDrilldown(String label, String prompt) {
    }

    public record GraphResult(
        String title,
        String chartType,
        String xAxis,
        String yAxis,
        String seriesLabel,
        List<GraphPoint> points,
        List<GraphDrilldown> drilldowns
    ) {
        public static GraphResult empty(String title, String chartType, String xAxis, String yAxis, String seriesLabel) {
            return new GraphResult(title, chartType, xAxis, yAxis, seriesLabel, List.of(), List.of());
        }

        public Map<String, Object> toMap() {
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("kind", "graph");
            data.put("title", title);
            data.put("chartType", chartType);
            data.put("xAxis", xAxis);
            data.put("yAxis", yAxis);
            data.put("seriesLabel", seriesLabel);
            data.put("categories", points.stream().map(GraphPoint::label).toList());
            data.put("values", points.stream().map(point -> point.value() == null ? 0 : point.value().doubleValue()).toList());
            data.put("points", points);
            data.put("drilldowns", drilldowns);
            data.put("total", points.stream().mapToDouble(point -> point.value() == null ? 0.0 : point.value().doubleValue()).sum());
            return data;
        }
    }
}
