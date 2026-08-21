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
import java.util.StringJoiner;

@Slf4j
@Component
@RequiredArgsConstructor
public class StudentExportAction implements StudentAction {

    private final StudentService studentService;
    private final ResponseBuilder responseBuilder;
    private final StudentQuerySupport studentQuerySupport;

    @Override
    public boolean supports(String action) {
        return "export".equalsIgnoreCase(action);
    }

    @Override
    public String action() {
        return "export";
    }

    @Override
    public ChatResponse handle(IntentDTO intent, String userMessage) {
        long startedAt = System.nanoTime();
        Map<String, Object> filters = intent != null && intent.getFilters() != null ? intent.getFilters() : Map.of();

        try {
            StudentActionContext context = studentQuerySupport.buildActionContext(filters);
            List<StudentListResponseDto> students = resolveStudents(context);

            if (students.isEmpty()) {
                log.info("Student export returned no rows for userMessage='{}'", userMessage);
                return responseBuilder.text("No students found to export.");
            }

            List<Integer> studentIds = students.stream()
                .map(StudentListResponseDto::getStudentId)
                .filter(java.util.Objects::nonNull)
                .toList();

            Map<String, Object> data = Map.of(
                "kind", "student_export",
                "fileName", "students.xlsx",
                "studentIds", studentIds,
                "count", studentIds.size()
            );

            String message = buildExportMessage(studentIds.size(), context);
            ChatResponse response = responseBuilder.download("Export Students", data, message);
            log.info("Student export prepared {} ids for userMessage='{}'", studentIds.size(), userMessage);
            return response;
        } catch (IllegalArgumentException ex) {
            log.info("Unsupported student export query for userMessage='{}': {}", userMessage, ex.getMessage());
            return responseBuilder.unsupportedStudentQuery();
        } catch (Exception ex) {
            log.error("Student export failed for userMessage='{}'", userMessage, ex);
            return responseBuilder.studentLookupFailure();
        } finally {
            long elapsedMs = (System.nanoTime() - startedAt) / 1_000_000;
            log.info("Student export action execution time: {} ms for userMessage='{}'", elapsedMs, userMessage);
        }
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

    private String buildExportMessage(int count, StudentActionContext context) {
        StringJoiner joiner = new StringJoiner(", ");
        if (StringUtils.hasText(context.sponsorName())) {
            joiner.add("sponsor " + context.sponsorName());
        }
        if (StringUtils.hasText(context.schoolName())) {
            joiner.add("school " + context.schoolName());
        }
        if (StringUtils.hasText(context.classId())) {
            joiner.add("class " + context.classId());
        }
        if (StringUtils.hasText(context.genderLabel())) {
            joiner.add(context.genderLabel());
        }
        if (context.orphan()) {
            joiner.add("orphan");
        }
        if (context.semiOrphan()) {
            joiner.add("semi orphan");
        }
        if (context.sponsored()) {
            joiner.add("sponsored");
        }

        String filterSummary = joiner.length() > 0 ? " for " + joiner : "";
        return "I found " + count + " students" + filterSummary + ". Your export is downloading now.";
    }
}
