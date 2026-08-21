package com.saho.foundation.ai.handler.student;

import com.saho.foundation.ai.dto.ChatResponse;
import com.saho.foundation.ai.dto.IntentDTO;
import com.saho.foundation.ai.service.ResponseBuilder;
import com.saho.foundation.dto.StudentDetailsResponseDto;
import com.saho.foundation.enums.Gender;
import com.saho.foundation.enums.OrphanStatus;
import com.saho.foundation.enums.Religion;
import com.saho.foundation.service.iservices.StudentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class StudentDetailsAction implements StudentAction {

    private static final DateTimeFormatter DOB_FORMATTER = DateTimeFormatter.ofPattern("dd-MMM-yyyy");

    private final StudentService studentService;
    private final ResponseBuilder responseBuilder;
    private final StudentQuerySupport studentQuerySupport;

    @Override
    public boolean supports(String action) {
        return "details".equalsIgnoreCase(action);
    }

    @Override
    public String action() {
        return "details";
    }

    @Override
    public ChatResponse handle(IntentDTO intent, String userMessage) {
        long startedAt = System.nanoTime();
        Map<String, Object> filters = intent != null && intent.getFilters() != null ? intent.getFilters() : Map.of();

        try {
            String studentName = studentQuerySupport.requireStudentName(filters);
            log.info("Executing student details lookup for userMessage='{}', studentName='{}'", userMessage, studentName);

            return studentService.getStudentDetailsByName(studentName)
                .map(details -> responseBuilder.card("Student Details", toCardData(details)))
                .orElseGet(() -> responseBuilder.text("No student found with the given name."));
        } catch (IllegalArgumentException ex) {
            log.info("Unsupported student details query for userMessage='{}': {}", userMessage, ex.getMessage());
            return responseBuilder.text("No student found with the given name.");
        } catch (Exception ex) {
            log.error("Student details retrieval failed for userMessage='{}'", userMessage, ex);
            return responseBuilder.studentLookupFailure();
        } finally {
            long elapsedMs = (System.nanoTime() - startedAt) / 1_000_000;
            log.info("Student details action execution time: {} ms for userMessage='{}'", elapsedMs, userMessage);
        }
    }

    private Map<String, Object> toCardData(StudentDetailsResponseDto details) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("Student Name", normalizeDisplayValue(details.getStudentName()));
        data.put("Gender", resolveEnumLabel(details.getGender(), Gender::getLabelByValue));
        data.put("Date of Birth", details.getDob() != null ? details.getDob().format(DOB_FORMATTER) : "-");
        data.put("Class", normalizeDisplayValue(details.getClassName()));
        data.put("School", normalizeDisplayValue(details.getSchoolName()));
        data.put("Guardian", normalizeDisplayValue(details.getGuardianName()));
        data.put("Phone", normalizeDisplayValue(details.getPhone()));
        data.put("Email", normalizeDisplayValue(details.getEmail()));
        data.put("Blood Group", normalizeDisplayValue(details.getBloodGroup()));
        data.put("Religion", resolveEnumLabel(details.getReligion(), Religion::getLabelByValue));
        data.put("Caste", normalizeDisplayValue(details.getCaste()));
        data.put("Orphan Status", resolveEnumLabel(details.getOrphanStatus(), OrphanStatus::getLabelByValue));
        data.put("Sponsor", normalizeDisplayValue(details.getSponsor()));
        return data;
    }

    private String resolveEnumLabel(String value, java.util.function.Function<String, String> labelResolver) {
        if (!StringUtils.hasText(value)) {
            return "-";
        }

        String label = labelResolver.apply(value.trim());
        return StringUtils.hasText(label) ? label : value.trim();
    }

    private String normalizeDisplayValue(String value) {
        return StringUtils.hasText(value) ? value.trim() : "-";
    }
}
