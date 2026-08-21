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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class CountStudentAction implements StudentAction {

    private final StudentService studentService;
    private final ResponseBuilder responseBuilder;
    private final StudentQuerySupport studentQuerySupport;

    @Override
    public boolean supports(String action) {
        return "count".equalsIgnoreCase(action);
    }

    @Override
    public String action() {
        return "count";
    }

    @Override
    public ChatResponse handle(IntentDTO intent, String userMessage) {
        long startedAt = System.nanoTime();
        Map<String, Object> filters = intent != null && intent.getFilters() != null ? intent.getFilters() : Map.of();

        try {
            StudentActionContext context = studentQuerySupport.buildActionContext(filters);

            log.info(
                "Selected StudentService Method for userMessage='{}', filters={}",
                userMessage,
                context.rawFilters()
            );

            if (isPureOrphanCount(context)) {
                long count = studentService.countStudentsByOrphanStatus(context.orphanStatusValue());
                return responseBuilder.studentCount(count, buildCountLabel(context));
            }

            List<StudentListResponseDto> students = resolveStudents(context);

            log.info("Total students fetched: {}", students.size());
            return responseBuilder.studentCount(students.size(), buildCountLabel(context));
        } catch (IllegalArgumentException ex) {
            log.info("Unsupported student count query for userMessage='{}': {}", userMessage, ex.getMessage());
            return responseBuilder.unsupportedStudentQuery();
        } catch (Exception ex) {
            log.error("Student count retrieval failed for userMessage='{}'", userMessage, ex);
            return responseBuilder.studentLookupFailure();
        } finally {
            long elapsedMs = (System.nanoTime() - startedAt) / 1_000_000;
            log.info("Student count action execution time: {} ms for userMessage='{}'", elapsedMs, userMessage);
        }
    }

    private String buildCountLabel(StudentActionContext context) {
        List<String> parts = new ArrayList<>();

        if ("active".equals(context.status())) {
            parts.add("active");
        }
        if (StringUtils.hasText(context.sponsorName())) {
            parts.add(context.sponsorName());
        }
        if (StringUtils.hasText(context.genderLabel())) {
            parts.add(context.genderLabel());
        }

        if (context.orphan()) {
            parts.add("orphan");
        }

        if (context.semiOrphan()) {
            parts.add("semi orphan");
        }

        if (context.sponsored()) {
            parts.add("sponsored");
        }

        parts.add("students");
        return String.join(" ", parts);
    }

    private boolean isPureOrphanCount(StudentActionContext context) {
        return context.orphanStatusValue() != null
            && !StringUtils.hasText(context.status())
            && !StringUtils.hasText(context.studentName())
            && !StringUtils.hasText(context.sponsorName())
            && !StringUtils.hasText(context.schoolName())
            && !StringUtils.hasText(context.genderValue())
            && !StringUtils.hasText(context.classId())
            && !context.sponsored();
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
}
