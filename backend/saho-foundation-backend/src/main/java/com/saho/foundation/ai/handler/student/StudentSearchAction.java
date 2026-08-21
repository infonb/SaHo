package com.saho.foundation.ai.handler.student;

import com.saho.foundation.ai.dto.ChatResponse;
import com.saho.foundation.ai.dto.IntentDTO;
import com.saho.foundation.ai.service.ResponseBuilder;
import com.saho.foundation.dto.StudentListResponseDto;
import com.saho.foundation.service.iservices.StudentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class StudentSearchAction implements StudentAction {

    private static final List<String> TABLE_COLUMNS = List.of(
        "Student Name",
        "Gender",
        "School",
        "Class",
        "Guardian"
    );

    private final StudentService studentService;
    private final ResponseBuilder responseBuilder;
    private final StudentQuerySupport studentQuerySupport;

    @Override
    public boolean supports(String action) {
        if (!StringUtils.hasText(action)) {
            return false;
        }

        String normalized = action.trim().toLowerCase();
        return "search".equals(normalized) || "list".equals(normalized);
    }

    @Override
    public String action() {
        return "search";
    }

    @Override
    public ChatResponse handle(IntentDTO intent, String userMessage) {
        long startedAt = System.nanoTime();
        Map<String, Object> filters = intent != null && intent.getFilters() != null ? intent.getFilters() : Map.of();

        try {
            StudentActionContext context = studentQuerySupport.buildActionContext(filters);
            logAppliedFilters(context);

            List<StudentListResponseDto> students = resolveStudents(context);

            if (students.isEmpty()) {
                log.info("Student search returned no rows for userMessage='{}'", userMessage);
                return responseBuilder.text("No students found.");
            }

            List<List<String>> rows = students.stream()
                .map(this::toTableRow)
                .toList();

            log.info("Student search returned {} rows for userMessage='{}'", rows.size(), userMessage);
            ChatResponse tableResponse = responseBuilder.table("Students", TABLE_COLUMNS, rows);
            log.info("StudentSearchAction final response: {}", tableResponse);
            return tableResponse;
        } catch (IllegalArgumentException ex) {
            log.info("Unsupported student search query for userMessage='{}': {}", userMessage, ex.getMessage());
            return responseBuilder.unsupportedStudentQuery();
        } catch (Exception ex) {
            log.error("Student search failed for userMessage='{}'", userMessage, ex);
            return responseBuilder.studentLookupFailure();
        } finally {
            long elapsedMs = (System.nanoTime() - startedAt) / 1_000_000;
            log.info("Student search action execution time: {} ms for userMessage='{}'", elapsedMs, userMessage);
        }
    }

    private void logAppliedFilters(StudentActionContext context) {
        StringBuilder builder = new StringBuilder("Applied Filters:\n");
        boolean any = false;

        if (StringUtils.hasText(context.studentName())) {
            builder.append("studentName = ").append(context.studentName()).append('\n');
            any = true;
        }
        if (StringUtils.hasText(context.sponsorName())) {
            builder.append("sponsorName = ").append(context.sponsorName()).append('\n');
            any = true;
        }
        if (StringUtils.hasText(context.schoolName())) {
            builder.append("schoolName = ").append(context.schoolName()).append('\n');
            any = true;
        }
        if (StringUtils.hasText(context.districtName())) {
            builder.append("districtName = ").append(context.districtName()).append('\n');
            any = true;
        }
        if (StringUtils.hasText(context.stateName())) {
            builder.append("stateName = ").append(context.stateName()).append('\n');
            any = true;
        }
        if (StringUtils.hasText(context.genderValue())) {
            builder.append("gender = ").append(context.genderValue()).append('\n');
            any = true;
        }
        if (StringUtils.hasText(context.classId())) {
            builder.append("class = ").append(context.classId()).append('\n');
            any = true;
        }
        if (StringUtils.hasText(context.orphanStatusValue())) {
            builder.append("orphanStatus = ").append(context.orphanStatusValue()).append('\n');
            any = true;
        }
        if (context.sponsored()) {
            builder.append("sponsored = true\n");
            any = true;
        }

        if (!any) {
            builder.append("none");
        }

        log.info(builder.toString().trim());
    }

    private List<String> toTableRow(StudentListResponseDto student) {
        return List.of(
            normalizeDisplayName(student.getName()),
            normalizeDisplayValue(student.getGender()),
            normalizeDisplayValue(student.getSchName()),
            normalizeDisplayValue(student.getClassName()),
            normalizeDisplayValue(student.getGuardianName())
        );
    }

    private List<StudentListResponseDto> resolveStudents(StudentActionContext context) {
        if (StringUtils.hasText(context.sponsorName())) {
            return studentService.searchStudentsBySponsorName(
                context.sponsorName(),
                context.studentName(),
                context.schoolName(),
                context.districtName(),
                context.stateName(),
                context.genderValue(),
                context.classId(),
                context.orphanStatusValue(),
                context.sponsored()
            );
        }

        return studentService.searchStudents(
            context.studentName(),
            context.schoolName(),
            context.districtName(),
            context.stateName(),
            context.genderValue(),
            context.classId(),
            context.orphanStatusValue(),
            context.sponsored()
        );
    }

    private String normalizeDisplayName(String value) {
        return StringUtils.hasText(value) ? value.trim() : "Unnamed student";
    }

    private String normalizeDisplayValue(String value) {
        return StringUtils.hasText(value) ? value.trim() : "-";
    }
}
