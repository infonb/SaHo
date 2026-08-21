package com.saho.foundation.ai.handler.student;

import com.saho.foundation.enums.Gender;
import com.saho.foundation.enums.OrphanStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class StudentQuerySupport {

    private static final Set<String> SUPPORTED_FILTERS = Set.of(
        "status",
        "studentname",
        "sponsorname",
        "schoolname",
        "districtname",
        "distname",
        "district",
        "statename",
        "stname",
        "state",
        "search",
        "query",
        "keyword",
        "gender",
        "classid",
        "class",
        "classname",
        "schname",
        "school",
        "orphan",
        "semiorphan",
        "orphanstatus",
        "sponsored"
    );

    private static final Set<String> DETAILS_FILTERS = Set.of(
        "studentname",
        "search",
        "query",
        "keyword"
    );

    public StudentActionContext buildActionContext(Map<String, Object> filters) {
        Map<String, Object> normalizedFilters = normalizeFilters(filters);
        validateSupportedFilters(normalizedFilters, SUPPORTED_FILTERS);

        String status = normalizeText(normalizedFilters.get("status"));
        Gender gender = resolveGender(normalizeText(normalizedFilters.get("gender")));
        String classId = resolveClassId(
            normalizedFilters.get("classid"),
            normalizedFilters.get("class"),
            normalizedFilters.get("classname")
        );
        String studentName = normalizeText(
            firstNonNull(
                normalizedFilters.get("studentname"),
                normalizedFilters.get("search"),
                normalizedFilters.get("query"),
                normalizedFilters.get("keyword")
            )
        );
        String sponsorName = normalizeText(
            firstNonNull(
                normalizedFilters.get("sponsorname"),
                normalizedFilters.get("sponsor")
            )
        );
        String schoolName = normalizeText(
            firstNonNull(
                normalizedFilters.get("schoolname"),
                normalizedFilters.get("schname"),
                normalizedFilters.get("school")
            )
        );
        String districtName = normalizeText(
            firstNonNull(
                normalizedFilters.get("districtname"),
                normalizedFilters.get("distname"),
                normalizedFilters.get("district")
            )
        );
        String stateName = normalizeText(
            firstNonNull(
                normalizedFilters.get("statename"),
                normalizedFilters.get("stname"),
                normalizedFilters.get("state")
            )
        );
        String orphanStatusValue = resolveOrphanStatusValue(
            normalizedFilters.get("orphan"),
            normalizedFilters.get("semiorphan"),
            normalizedFilters.get("orphanstatus")
        );
        boolean orphan = OrphanStatus.ORPHAN.getValue().equals(orphanStatusValue);
        boolean semiOrphan = OrphanStatus.SINGLE_PARENT.getValue().equals(orphanStatusValue);
        boolean sponsored = resolveRequiredTrueFilter(normalizedFilters.get("sponsored"), "sponsored");

        return new StudentActionContext(
            normalize(status),
            studentName,
            sponsorName,
            schoolName,
            districtName,
            stateName,
            gender != null ? gender.getValue() : null,
            gender != null ? gender.getLabel().toLowerCase(Locale.ROOT) : null,
            classId,
            orphanStatusValue,
            orphan,
            semiOrphan,
            sponsored,
            normalizedFilters
        );
    }

    public String requireStudentName(Map<String, Object> filters) {
        Map<String, Object> normalizedFilters = normalizeFilters(filters);
        validateSupportedFilters(normalizedFilters, DETAILS_FILTERS);

        String studentName = normalizeText(
            firstNonNull(
                normalizedFilters.get("studentname"),
                normalizedFilters.get("search"),
                normalizedFilters.get("query"),
                normalizedFilters.get("keyword")
            )
        );

        if (!StringUtils.hasText(studentName)) {
            throw new IllegalArgumentException("studentName is required");
        }

        return studentName;
    }

    private Map<String, Object> normalizeFilters(Map<String, Object> filters) {
        Map<String, Object> normalizedFilters = new LinkedHashMap<>();
        if (filters == null) {
            return normalizedFilters;
        }

        filters.forEach((key, value) -> normalizedFilters.put(String.valueOf(key).toLowerCase(Locale.ROOT), value));
        return normalizedFilters;
    }

    private void validateSupportedFilters(Map<String, Object> filters, Set<String> supportedFilters) {
        Set<String> filterNames = filters.keySet().stream()
            .map(String::valueOf)
            .map(value -> value.toLowerCase(Locale.ROOT))
            .collect(Collectors.toSet());

        if (!supportedFilters.containsAll(filterNames)) {
            throw new IllegalArgumentException("Unsupported filters: " + filterNames);
        }
    }

    private Gender resolveGender(String gender) {
        if (!StringUtils.hasText(gender)) {
            return null;
        }

        return switch (gender.toLowerCase(Locale.ROOT)) {
            case "1", "male" -> Gender.MALE;
            case "2", "female" -> Gender.FEMALE;
            case "3", "other", "others" -> Gender.OTHER;
            default -> throw new IllegalArgumentException("Unsupported gender filter: " + gender);
        };
    }

    private String resolveOrphanStatusValue(Object orphanFilter, Object semiOrphanFilter, Object orphanStatusFilter) {
        if (resolveRequiredTrueFilter(orphanFilter, "orphan")) {
            return OrphanStatus.ORPHAN.getValue();
        }

        if (resolveRequiredTrueFilter(semiOrphanFilter, "semiOrphan")) {
            return OrphanStatus.SINGLE_PARENT.getValue();
        }

        String orphanStatus = normalizeText(orphanStatusFilter);
        if (!StringUtils.hasText(orphanStatus)) {
            return null;
        }

        return switch (orphanStatus.toLowerCase(Locale.ROOT)) {
            case "3", "orphan", "orphaned" -> OrphanStatus.ORPHAN.getValue();
            case "2", "single_parent", "single parent", "semi_orphan", "semi orphan" ->
                OrphanStatus.SINGLE_PARENT.getValue();
            case "1", "none" -> null;
            default -> throw new IllegalArgumentException("Unsupported orphanStatus filter: " + orphanStatus);
        };
    }

    private boolean resolveRequiredTrueFilter(Object value, String filterName) {
        if (value == null) {
            return false;
        }

        String text = normalizeText(value);
        if (!StringUtils.hasText(text)) {
            return false;
        }

        return switch (text.toLowerCase(Locale.ROOT)) {
            case "true", "1", "yes" -> true;
            case "false", "0", "no" -> false;
            default -> throw new IllegalArgumentException("Unsupported " + filterName + " filter: " + value);
        };
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeText(Object value) {
        if (value == null) {
            return null;
        }

        String text = String.valueOf(value).trim();
        return text.isEmpty() ? null : text;
    }

    private String resolveClassId(Object classId, Object className, Object classLabel) {
        String text = normalizeText(firstNonNull(classId, className, classLabel));
        if (!StringUtils.hasText(text)) {
            return null;
        }

        String digitsOnly = text.replaceAll("\\D+", "");
        return StringUtils.hasText(digitsOnly) ? digitsOnly : text;
    }

    private Object firstNonNull(Object... values) {
        for (Object value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }
}
