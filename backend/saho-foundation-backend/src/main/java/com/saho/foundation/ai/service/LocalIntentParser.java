package com.saho.foundation.ai.service;

import com.saho.foundation.ai.dto.IntentDTO;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.format.DateTimeFormatterBuilder;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class LocalIntentParser {

    private static final Pattern STUDENT_HINT = Pattern.compile("\\bstudents?\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern COUNT_HINT = Pattern.compile("\\b(how many|total|number of|count)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern SEARCH_HINT = Pattern.compile("\\b(show|list|display|search|find)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern DETAILS_HINT = Pattern.compile("\\bdetails?\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern SPONSOR_MODULE_HINT = Pattern.compile("\\bsponsors?\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern SCHOOL_MODULE_HINT = Pattern.compile("\\bschools?\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern REMINDER_MODULE_HINT = Pattern.compile("\\breminders?\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern ACTIVE_HINT = Pattern.compile("\\bactive\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern MALE_HINT = Pattern.compile("\\bmale\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern FEMALE_HINT = Pattern.compile("\\bfemale\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern OTHER_HINT = Pattern.compile("\\bother(?:s)?\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern UPCOMING_HINT = Pattern.compile("\\bupcoming\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern ONGOING_HINT = Pattern.compile("\\bongoing\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern COMPLETED_HINT = Pattern.compile("\\bcompleted?\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern CANCELLED_HINT = Pattern.compile("\\bcancel(?:led|ed)?\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern ORPHAN_HINT = Pattern.compile("\\borphan(?:ed)?\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern SINGLE_PARENT_HINT = Pattern.compile("\\b(?:single parents?|semi[- ]orphans?)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern SPONSORED_HINT = Pattern.compile("\\bsponsored\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern SPONSOR_HINT = Pattern.compile("\\bsponsor(?:ed)?\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern SPONSOR_MONTH_HINT = Pattern.compile("\\b(?:registered|created|joined)\\s+(?:in|on)\\s+([a-z]{3,9}[\\s-]\\d{4}|\\d{4}-\\d{2})\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern EXPORT_HINT = Pattern.compile("\\b(export|download|save)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern GRAPH_HINT = Pattern.compile("\\b(graph|chart|plot|visuali[sz]e|analytics|analysis|distribution|breakdown|trend|trends|wise|monthly|registration|registrations)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern STATUS_HINT = Pattern.compile("\\bstatus\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern DONUT_HINT = Pattern.compile("\\bdonut\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern PIE_HINT = Pattern.compile("\\bpie\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern LINE_HINT = Pattern.compile("\\bline\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern AREA_HINT = Pattern.compile("\\barea\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern BAR_HINT = Pattern.compile("\\bbar\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern SCHOOL_HINT = Pattern.compile("\\b(?:students?\\s+)?(?:studying in|studies in|study in|from)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern CLASS_HINT = Pattern.compile("\\bclass\\s+([a-z0-9][a-z0-9\\-]*)\\b", Pattern.CASE_INSENSITIVE);

    public Optional<IntentDTO> parse(String message) {
        if (!StringUtils.hasText(message)) {
            return Optional.empty();
        }

        String normalized = normalize(message);
        Map<String, Object> filters = new LinkedHashMap<>();

        if (ACTIVE_HINT.matcher(normalized).find()) {
            filters.put("status", "active");
        }

        if (MALE_HINT.matcher(normalized).find()) {
            filters.put("gender", "male");
        }

        if (FEMALE_HINT.matcher(normalized).find()) {
            filters.put("gender", "female");
        }

        if (OTHER_HINT.matcher(normalized).find()) {
            filters.put("gender", "other");
        }

        if (ORPHAN_HINT.matcher(normalized).find()) {
            filters.put("orphan", true);
        }

        if (SINGLE_PARENT_HINT.matcher(normalized).find()) {
            filters.put("semiOrphan", true);
        }

        if (SPONSORED_HINT.matcher(normalized).find()) {
            filters.put("sponsored", true);
        }

        String reminderStatus = extractReminderStatus(normalized);
        if (StringUtils.hasText(reminderStatus)) {
            filters.put("status", reminderStatus);
        }

        String sponsorName = extractSponsorName(normalized);
        if (StringUtils.hasText(sponsorName)) {
            filters.put("sponsorName", sponsorName);
        }

        String sponsorType = extractSponsorType(normalized);
        if (StringUtils.hasText(sponsorType)) {
            filters.put("type", sponsorType);
        }

        String nationality = extractSponsorNationality(normalized);
        if (StringUtils.hasText(nationality)) {
            filters.put("nationality", nationality);
        }

        String createdMonth = extractSponsorCreatedMonth(normalized);
        if (StringUtils.hasText(createdMonth)) {
            filters.put("createdMonth", createdMonth);
        }

        String schoolName = extractSchoolQuery(normalized);
        if (!StringUtils.hasText(schoolName)) {
            schoolName = extractSchoolName(normalized);
        }
        if (StringUtils.hasText(schoolName)) {
            filters.put("schoolName", schoolName);
        }

        String districtName = extractDistrictName(normalized);
        if (StringUtils.hasText(districtName)) {
            filters.put("districtName", districtName);
        }

        String stateName = extractStateName(normalized);
        if (StringUtils.hasText(stateName)) {
            filters.put("stateName", stateName);
        }

        String reminderQuery = extractReminderQuery(normalized);
        if (StringUtils.hasText(reminderQuery)) {
            filters.put("search", reminderQuery);
        }

        String graphDataset = extractGraphDataset(normalized);
        if (StringUtils.hasText(graphDataset)) {
            filters.put("graphDataset", graphDataset);
        }

        String chartType = extractGraphChartType(normalized, graphDataset);
        if (StringUtils.hasText(chartType)) {
            filters.put("chartType", chartType);
        }

        String studentName = extractStudentName(normalized);
        if (StringUtils.hasText(studentName)) {
            filters.put("studentName", studentName);
        }

        String classValue = extractClassValue(normalized);
        if (StringUtils.hasText(classValue)) {
            filters.put("class", classValue);
        }

        boolean countIntent = COUNT_HINT.matcher(normalized).find();
        boolean studentSignalsPresent = hasStudentSignals(filters);
        boolean sponsorSignalsPresent = hasSponsorSignals(filters);
        boolean schoolSignalsPresent = hasSchoolSignals(filters);
        boolean reminderSignalsPresent = hasReminderSignals(filters);
        boolean detailsIntent = hasDetailsIntent(normalized);
        boolean sponsorModuleHint = SPONSOR_MODULE_HINT.matcher(normalized).find()
            || sponsorSignalsPresent;
        boolean schoolModuleHint = SCHOOL_MODULE_HINT.matcher(normalized).find()
            || schoolSignalsPresent;
        boolean reminderModuleHint = REMINDER_MODULE_HINT.matcher(normalized).find()
            || reminderSignalsPresent;
        boolean studentModuleHint = STUDENT_HINT.matcher(normalized).find()
            || studentSignalsPresent
            || detailsIntent;

        if (EXPORT_HINT.matcher(normalized).find()) {
            String exportModule = reminderModuleHint
                ? "reminders"
                : sponsorModuleHint && !studentSignalsPresent
                ? "sponsors"
                : "students";
            return Optional.of(IntentDTO.builder()
                .module(exportModule)
                .action("export")
                .filters(filters)
                .responseType("excel")
                .reportType(null)
                .build());
        }

        if (StringUtils.hasText(graphDataset)) {
            return Optional.of(IntentDTO.builder()
                .module("analytics")
                .action("graph")
                .filters(filters)
                .responseType("graph")
                .reportType(null)
                .build());
        }

        if (countIntent) {
            return Optional.of(IntentDTO.builder()
                .module("students")
                .action("count")
                .filters(filters)
                .responseType("text")
                .reportType(null)
                .build());
        }

        if (detailsIntent && StringUtils.hasText(studentName)) {
            return Optional.of(IntentDTO.builder()
                .module("students")
                .action("details")
                .filters(filters)
                .responseType("card")
                .reportType(null)
                .build());
        }

        boolean sponsorSearchIntent = sponsorModuleHint
            && !studentModuleHint
            && (SEARCH_HINT.matcher(normalized).find()
                || sponsorSignalsPresent
                || normalized.equals("sponsors")
                || normalized.equals("sponsor"));

        if (sponsorSearchIntent) {
            return Optional.of(IntentDTO.builder()
                .module("sponsors")
                .action("search")
                .filters(filters)
                .responseType("table")
                .reportType(null)
                .build());
        }

        boolean schoolSearchIntent = schoolModuleHint
            && !studentModuleHint
            && (SEARCH_HINT.matcher(normalized).find()
                || schoolSignalsPresent
                || normalized.equals("schools")
                || normalized.equals("school"));

        if (schoolSearchIntent) {
            return Optional.of(IntentDTO.builder()
                .module("schools")
                .action("search")
                .filters(filters)
                .responseType("table")
                .reportType(null)
                .build());
        }

        boolean reminderSearchIntent = reminderModuleHint
            && (SEARCH_HINT.matcher(normalized).find()
                || reminderSignalsPresent
                || normalized.equals("reminders")
                || normalized.equals("reminder"));

        if (reminderSearchIntent) {
            return Optional.of(IntentDTO.builder()
                .module("reminders")
                .action("search")
                .filters(filters)
                .responseType("table")
                .reportType(null)
                .build());
        }

        boolean searchIntent = SEARCH_HINT.matcher(normalized).find()
            || studentSignalsPresent
            || normalized.equals("students")
            || normalized.equals("student");

        if (!studentModuleHint || !searchIntent) {
            return Optional.empty();
        }

        return Optional.of(IntentDTO.builder()
            .module("students")
            .action("search")
            .filters(filters)
            .responseType("table")
            .reportType(null)
            .build());
    }

    private boolean hasStudentSignals(Map<String, Object> filters) {
        return filters.containsKey("studentName")
            || filters.containsKey("class")
            || filters.containsKey("gender")
            || filters.containsKey("orphan")
            || filters.containsKey("orphanStatus")
            || filters.containsKey("sponsored")
            || filters.containsKey("districtName")
            || filters.containsKey("stateName");
    }

    private boolean hasSponsorSignals(Map<String, Object> filters) {
        return filters.containsKey("sponsorName")
            || filters.containsKey("type")
            || filters.containsKey("nationality")
            || filters.containsKey("createdMonth");
    }

    private boolean hasSchoolSignals(Map<String, Object> filters) {
        return filters.containsKey("schoolName")
            || filters.containsKey("school")
            || filters.containsKey("schName");
    }

    private boolean hasReminderSignals(Map<String, Object> filters) {
        return filters.containsKey("search")
            || filters.containsKey("status");
    }

    private boolean hasDetailsIntent(String normalized) {
        return DETAILS_HINT.matcher(normalized).find()
            || normalized.startsWith("student ")
            || normalized.startsWith("who is ")
            || normalized.startsWith("tell me about ")
            || normalized.startsWith("show profile of ")
            || normalized.startsWith("show information of ")
            || normalized.startsWith("show details of ")
            || normalized.startsWith("find student ")
            || normalized.startsWith("search student ");
    }

    private String extractStudentName(String normalized) {
        String[] prefixes = {
            "tell me about ",
            "who is ",
            "show profile of ",
            "show information of ",
            "show details of ",
            "show detail of ",
            "details of ",
            "detail of ",
            "student details of ",
            "find student ",
            "show student ",
            "list student ",
            "display student ",
            "search student ",
            "student ",
            "find ",
            "show ",
            "list ",
            "display ",
            "search ",
            "details ",
            "detail "
        };

        for (String prefix : prefixes) {
            if (!normalized.startsWith(prefix)) {
                continue;
            }

            String candidate = cleanupExtract(normalized.substring(prefix.length()));
            candidate = trimTrailingQualifiers(candidate);
            if (isLikelySchoolQuery(candidate) || isLikelyFilterPhrase(candidate)) {
                return null;
            }

            return StringUtils.hasText(candidate) ? candidate : null;
        }

        return null;
    }

    private String extractSchoolQuery(String normalized) {
        String[] prefixes = {
            "show schools in ",
            "list schools in ",
            "search schools in ",
            "find schools in ",
            "schools in ",
            "school in ",
            "show schools from ",
            "list schools from ",
            "search schools from ",
            "find schools from ",
            "schools from ",
            "school from ",
            "show school ",
            "list school ",
            "search school ",
            "find school "
        };

        for (String prefix : prefixes) {
            int index = normalized.indexOf(prefix);
            if (index < 0) {
                continue;
            }

            String candidate = cleanupExtract(normalized.substring(index + prefix.length()));
            if (isLikelyFilterPhrase(candidate) || isGenericSchoolPhrase(candidate)) {
                return null;
            }

            return StringUtils.hasText(candidate) ? candidate : null;
        }

        return null;
    }

    private String extractReminderQuery(String normalized) {
        String[] prefixes = {
            "show reminders about ",
            "list reminders about ",
            "search reminders about ",
            "find reminders about ",
            "reminders about ",
            "reminder about ",
            "show reminders for ",
            "list reminders for ",
            "search reminders for ",
            "find reminders for ",
            "reminders for ",
            "reminder for "
        };

        for (String prefix : prefixes) {
            int index = normalized.indexOf(prefix);
            if (index < 0) {
                continue;
            }

            String candidate = cleanupExtract(normalized.substring(index + prefix.length()));
            if (isLikelyFilterPhrase(candidate) || isGenericReminderPhrase(candidate)) {
                return null;
            }

            return StringUtils.hasText(candidate) ? candidate : null;
        }

        return null;
    }

    private String extractSponsorName(String normalized) {
        String[] prefixes = {
            "students assigned to sponsor ",
            "student assigned to sponsor ",
            "sponsors assigned to ",
            "show sponsors assigned to ",
            "assigned to sponsor ",
            "show sponsor ",
            "find sponsor ",
            "list sponsor ",
            "sponsor "
        };

        for (String prefix : prefixes) {
            int index = normalized.indexOf(prefix);
            if (index < 0) {
                continue;
            }

            String candidate = cleanupExtract(normalized.substring(index + prefix.length()));
            if (isLikelyFilterPhrase(candidate)) {
                return null;
            }

            if (!StringUtils.hasText(candidate)) {
                return null;
            }

            return candidate.toLowerCase(Locale.ROOT).startsWith("sponsor ")
                ? candidate
                : "Sponsor " + candidate;
        }

        return null;
    }

    private String extractSponsorType(String normalized) {
        if (normalized.contains("organisation") || normalized.contains("organization")) {
            return "Organisation";
        }
        if (normalized.contains("individual")) {
            return "Individual";
        }
        return null;
    }

    private String extractSponsorNationality(String normalized) {
        if (normalized.contains("foreigner")) {
            return "Foreigner";
        }
        if (normalized.contains("indian")) {
            return "Indian";
        }
        return null;
    }

    private String extractSponsorCreatedMonth(String normalized) {
        if (!normalized.contains("sponsor") && !SPONSOR_MONTH_HINT.matcher(normalized).find()) {
            return null;
        }

        String[] prefixes = {
            "show sponsors registered in ",
            "list sponsors registered in ",
            "search sponsors registered in ",
            "find sponsors registered in ",
            "export sponsors registered in ",
            "sponsors registered in ",
            "sponsor registered in ",
            "registered in ",
            "created in ",
            "joined in "
        };

        for (String prefix : prefixes) {
            int index = normalized.indexOf(prefix);
            if (index < 0) {
                continue;
            }

            String candidate = cleanupExtract(normalized.substring(index + prefix.length()));
            candidate = normalizeMonthLabel(candidate);
            return StringUtils.hasText(candidate) ? candidate : null;
        }

        return null;
    }

    private String extractSchoolName(String normalized) {
        String[] prefixes = {
            "students studying in ",
            "student studying in ",
            "studying in ",
            "students from ",
            "student from ",
            "from "
        };

        for (String prefix : prefixes) {
            int index = normalized.indexOf(prefix);
            if (index < 0) {
                continue;
            }

            String candidate = cleanupExtract(normalized.substring(index + prefix.length()));
            if (isLikelyFilterPhrase(candidate)) {
                return null;
            }

            return StringUtils.hasText(candidate) ? candidate : null;
        }

        return null;
    }

    private String extractClassValue(String normalized) {
        int index = normalized.indexOf("class ");
        if (index < 0) {
            return null;
        }

        String candidate = cleanupExtract(normalized.substring(index + "class ".length()));
        if (!StringUtils.hasText(candidate)) {
            return null;
        }

        String firstToken = candidate.split("\\s+")[0];
        return StringUtils.hasText(firstToken) ? firstToken : null;
    }

    private String extractReminderStatus(String normalized) {
        if (UPCOMING_HINT.matcher(normalized).find()) {
            return "upcoming";
        }
        if (ONGOING_HINT.matcher(normalized).find()) {
            return "ongoing";
        }
        if (COMPLETED_HINT.matcher(normalized).find()) {
            return "completed";
        }
        if (CANCELLED_HINT.matcher(normalized).find()) {
            return "cancelled";
        }
        return null;
    }

    private String extractGraphDataset(String normalized) {
        boolean hasGraphStyleIntent = GRAPH_HINT.matcher(normalized).find();
        if (!hasGraphStyleIntent) {
            return null;
        }

        boolean hasGender = normalized.contains("gender");
        boolean hasDistrict = normalized.contains("district");
        boolean hasState = normalized.contains("state");
        boolean hasReminder = normalized.contains("reminder");
        boolean hasSponsor = normalized.contains("sponsor");
        boolean hasSchool = normalized.contains("school");
        boolean hasAge = normalized.contains("age");
        boolean hasCount = normalized.contains("count");
        boolean hasMonthly = normalized.contains("monthly");
        boolean hasTrend = normalized.contains("trend");
        boolean hasDistribution = normalized.contains("distribution");
        boolean hasOrphan = normalized.contains("orphan");

        if (hasGender && hasDistribution) {
            return "gender_distribution";
        }

        if (hasDistrict && hasCount) {
            return "district_student_count";
        }

        if (hasState && hasOrphan) {
            return "state_orphan_students";
        }

        if (hasReminder && STATUS_HINT.matcher(normalized).find()) {
            return "reminder_status_distribution";
        }

        if (hasSchool && hasCount) {
            return "school_student_count";
        }

        if (hasAge && hasDistribution) {
            return "age_distribution";
        }

        if (hasSponsor && (hasMonthly || hasTrend)) {
            return hasTrend ? "sponsorship_trends" : "monthly_sponsor_registrations";
        }

        if (hasSponsor && hasTrend) {
            return "sponsorship_trends";
        }

        if (hasGender && hasGraphStyleIntent) {
            return "gender_distribution";
        }

        if (hasDistrict && hasGraphStyleIntent) {
            return "district_student_count";
        }

        if (hasState && hasGraphStyleIntent && hasOrphan) {
            return "state_orphan_students";
        }

        if (hasReminder && hasGraphStyleIntent) {
            return "reminder_status_distribution";
        }

        if (hasSchool && hasGraphStyleIntent) {
            return "school_student_count";
        }

        if (hasAge && hasGraphStyleIntent) {
            return "age_distribution";
        }

        if (hasSponsor && hasGraphStyleIntent) {
            return "sponsorship_trends";
        }

        return null;
    }

    private String extractDistrictName(String normalized) {
        if (!normalized.contains(" district")) {
            return null;
        }

        String[] prefixes = {
            "show students from ",
            "list students from ",
            "search students from ",
            "find students from ",
            "students from ",
            "student from ",
            "show orphan students from ",
            "list orphan students from ",
            "search orphan students from ",
            "find orphan students from ",
            "orphan students from "
        };

        for (String prefix : prefixes) {
            int index = normalized.indexOf(prefix);
            if (index < 0) {
                continue;
            }

            String candidate = cleanupExtract(normalized.substring(index + prefix.length()));
            candidate = trimSuffix(candidate, " district");
            candidate = trimSuffix(candidate, " districts");
            if (isLikelyFilterPhrase(candidate) || isGenericDistrictPhrase(candidate)) {
                return null;
            }

            return StringUtils.hasText(candidate) ? candidate : null;
        }

        return null;
    }

    private String extractStateName(String normalized) {
        if (!normalized.contains(" state")) {
            return null;
        }

        String[] prefixes = {
            "show students from ",
            "list students from ",
            "search students from ",
            "find students from ",
            "students from ",
            "student from ",
            "show orphan students from ",
            "list orphan students from ",
            "search orphan students from ",
            "find orphan students from ",
            "orphan students from "
        };

        for (String prefix : prefixes) {
            int index = normalized.indexOf(prefix);
            if (index < 0) {
                continue;
            }

            String candidate = cleanupExtract(normalized.substring(index + prefix.length()));
            candidate = trimSuffix(candidate, " state");
            candidate = trimSuffix(candidate, " states");
            if (isLikelyFilterPhrase(candidate) || isGenericStatePhrase(candidate)) {
                return null;
            }

            return StringUtils.hasText(candidate) ? candidate : null;
        }

        return null;
    }

    private String extractGraphChartType(String normalized, String graphDataset) {
        if (DONUT_HINT.matcher(normalized).find()) {
            return "donut";
        }
        if (PIE_HINT.matcher(normalized).find()) {
            return "pie";
        }
        if (LINE_HINT.matcher(normalized).find()) {
            return "line";
        }
        if (AREA_HINT.matcher(normalized).find()) {
            return "area";
        }
        if (BAR_HINT.matcher(normalized).find()) {
            return "bar";
        }

        if (!StringUtils.hasText(graphDataset)) {
            return null;
        }

        return switch (graphDataset) {
            case "gender_distribution", "reminder_status_distribution" -> "donut";
            case "monthly_sponsor_registrations" -> "line";
            case "sponsorship_trends" -> "area";
            default -> "bar";
        };
    }

    private boolean isLikelySchoolQuery(String candidate) {
        if (!StringUtils.hasText(candidate)) {
            return false;
        }

        String normalizedCandidate = candidate.toLowerCase(Locale.ROOT);
        return normalizedCandidate.startsWith("students ")
            || normalizedCandidate.startsWith("student ")
            || normalizedCandidate.contains(" studying in ")
            || normalizedCandidate.contains(" from ")
            || normalizedCandidate.contains(" female ")
            || normalizedCandidate.contains(" male ")
            || normalizedCandidate.contains(" orphan ")
            || normalizedCandidate.contains(" sponsored ")
            || normalizedCandidate.contains(" school ")
            || CLASS_HINT.matcher(normalizedCandidate).find();
    }

    private boolean isLikelyFilterPhrase(String candidate) {
        if (!StringUtils.hasText(candidate)) {
            return true;
        }

        String normalizedCandidate = candidate.toLowerCase(Locale.ROOT);
        return normalizedCandidate.contains("students")
            || normalizedCandidate.contains("student")
            || normalizedCandidate.contains("sponsor")
            || normalizedCandidate.contains("school")
            || normalizedCandidate.contains("reminder")
            || normalizedCandidate.contains("female")
            || normalizedCandidate.contains("male")
            || normalizedCandidate.contains("orphan")
            || normalizedCandidate.contains("sponsored");
    }

    private boolean isGenericSchoolPhrase(String candidate) {
        if (!StringUtils.hasText(candidate)) {
            return true;
        }

        String normalizedCandidate = candidate.toLowerCase(Locale.ROOT);
        return normalizedCandidate.equals("school")
            || normalizedCandidate.equals("schools")
            || normalizedCandidate.equals("all school")
            || normalizedCandidate.equals("all schools");
    }

    private boolean isGenericReminderPhrase(String candidate) {
        if (!StringUtils.hasText(candidate)) {
            return true;
        }

        String normalizedCandidate = candidate.toLowerCase(Locale.ROOT);
        return normalizedCandidate.equals("reminder")
            || normalizedCandidate.equals("reminders")
            || normalizedCandidate.equals("all reminder")
            || normalizedCandidate.equals("all reminders");
    }

    private boolean isGenericDistrictPhrase(String candidate) {
        if (!StringUtils.hasText(candidate)) {
            return true;
        }

        String normalizedCandidate = candidate.toLowerCase(Locale.ROOT);
        return normalizedCandidate.equals("district")
            || normalizedCandidate.equals("districts")
            || normalizedCandidate.equals("all district")
            || normalizedCandidate.equals("all districts");
    }

    private boolean isGenericStatePhrase(String candidate) {
        if (!StringUtils.hasText(candidate)) {
            return true;
        }

        String normalizedCandidate = candidate.toLowerCase(Locale.ROOT);
        return normalizedCandidate.equals("state")
            || normalizedCandidate.equals("states")
            || normalizedCandidate.equals("all state")
            || normalizedCandidate.equals("all states");
    }

    private String cleanupExtract(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        String cleaned = value.trim()
            .replaceAll("[?.!,]+$", "")
            .replaceAll("\\s+", " ");
        return cleaned.isEmpty() ? null : cleaned;
    }

    private String trimTrailingQualifiers(String value) {
        if (!StringUtils.hasText(value)) {
            return value;
        }

        String trimmed = value;
        String[] stopWords = {
            " or another ",
            " or ",
            " and another ",
            " and ",
            " details",
            " detail",
            " information",
            " info",
            " profile"
        };

        for (String stopWord : stopWords) {
            int index = trimmed.indexOf(stopWord);
            if (index > 0) {
                trimmed = trimmed.substring(0, index).trim();
            }
        }

        return trimmed;
    }

    private String trimSuffix(String value, String suffix) {
        if (!StringUtils.hasText(value) || !StringUtils.hasText(suffix)) {
            return value;
        }

        String normalizedValue = value.toLowerCase(Locale.ROOT);
        String normalizedSuffix = suffix.toLowerCase(Locale.ROOT);
        if (normalizedValue.endsWith(normalizedSuffix)) {
            return value.substring(0, value.length() - suffix.length()).trim();
        }

        return value;
    }

    private String normalize(String message) {
        return message.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeMonthLabel(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        String text = value.trim();
        List<DateTimeFormatter> formatters = List.of(
            new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("MMM-yyyy").toFormatter(Locale.ENGLISH),
            new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("MMM yyyy").toFormatter(Locale.ENGLISH),
            new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("MMMM yyyy").toFormatter(Locale.ENGLISH),
            new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("yyyy-MM").toFormatter(Locale.ENGLISH)
        );

        for (DateTimeFormatter formatter : formatters) {
            try {
                return YearMonth.parse(text, formatter).format(DateTimeFormatter.ofPattern("MMM-yyyy", Locale.ENGLISH));
            } catch (DateTimeParseException ex) {
                // try next supported month format
            }
        }

        return text;
    }
}
