package com.saho.foundation.ai.service;

import com.saho.foundation.ai.dto.IntentDTO;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LocalIntentParserTest {

    private final LocalIntentParser parser = new LocalIntentParser();

    @Test
    void parsesSingleParentQueriesAsOrphanStatusTwo() {
        IntentDTO intent = parser.parse("How many single parent students are there?")
                .orElseThrow();

        assertEquals("students", intent.getModule());
        assertEquals("count", intent.getAction());
        assertEquals("text", intent.getResponseType());
        assertEquals(null, intent.getReportType());
        assertEquals(true, intent.getFilters().get("semiOrphan"));
    }

    @Test
    void parsesSemiOrphanQueriesAsOrphanStatusTwo() {
        IntentDTO intent = parser.parse("How many semi orphan students are there?")
                .orElseThrow();

        assertEquals(true, intent.getFilters().get("semiOrphan"));
    }

    @Test
    void parsesPluralAndHyphenatedSingleParentQueriesAsOrphanStatusTwo() {
        IntentDTO pluralIntent = parser.parse("Count single parent students.")
                .orElseThrow();
        IntentDTO hyphenatedIntent = parser.parse("Count semi-orphans students.")
                .orElseThrow();

        assertEquals(true, pluralIntent.getFilters().get("semiOrphan"));
        assertEquals(true, hyphenatedIntent.getFilters().get("semiOrphan"));
        assertTrue(pluralIntent.getFilters().containsKey("semiOrphan"));
        assertTrue(hyphenatedIntent.getFilters().containsKey("semiOrphan"));
    }

    @Test
    void parsesShowFemaleStudentsAsSearchIntent() {
        IntentDTO intent = parser.parse("Show female students").orElseThrow();

        assertEquals("students", intent.getModule());
        assertEquals("search", intent.getAction());
        assertEquals("table", intent.getResponseType());
        assertEquals("female", intent.getFilters().get("gender"));
        assertFalse(intent.getFilters().containsKey("orphanStatus"));
    }

    @Test
    void parsesShowAllStudentsAsSearchIntent() {
        IntentDTO intent = parser.parse("Show all students").orElseThrow();

        assertEquals("students", intent.getModule());
        assertEquals("search", intent.getAction());
        assertEquals("table", intent.getResponseType());
    }

    @Test
    void parsesSponsorAssignedStudentsAsSearchIntent() {
        IntentDTO intent = parser.parse("Show students assigned to Sponsor XYZ").orElseThrow();

        assertEquals("students", intent.getModule());
        assertEquals("search", intent.getAction());
        assertEquals("Sponsor xyz", intent.getFilters().get("sponsorName"));
    }

    @Test
    void parsesShowAllSponsorsAsSponsorSearchIntent() {
        IntentDTO intent = parser.parse("Show all sponsors").orElseThrow();

        assertEquals("sponsors", intent.getModule());
        assertEquals("search", intent.getAction());
        assertEquals("table", intent.getResponseType());
    }

    @Test
    void parsesShowAllSchoolsAsSchoolSearchIntent() {
        IntentDTO intent = parser.parse("Show all schools").orElseThrow();

        assertEquals("schools", intent.getModule());
        assertEquals("search", intent.getAction());
        assertEquals("table", intent.getResponseType());
    }

    @Test
    void parsesListSchoolsInGunturAsSchoolSearchIntent() {
        IntentDTO intent = parser.parse("List schools in Guntur").orElseThrow();

        assertEquals("schools", intent.getModule());
        assertEquals("search", intent.getAction());
        assertEquals("guntur", intent.getFilters().get("schoolName"));
    }

    @Test
    void parsesShowAllRemindersAsReminderSearchIntent() {
        IntentDTO intent = parser.parse("Show all reminders").orElseThrow();

        assertEquals("reminders", intent.getModule());
        assertEquals("search", intent.getAction());
        assertEquals("table", intent.getResponseType());
        assertFalse(intent.getFilters().containsKey("studentName"));
    }

    @Test
    void parsesUpcomingRemindersAsReminderSearchIntent() {
        IntentDTO intent = parser.parse("Show upcoming reminders").orElseThrow();

        assertEquals("reminders", intent.getModule());
        assertEquals("search", intent.getAction());
        assertEquals("upcoming", intent.getFilters().get("status"));
        assertFalse(intent.getFilters().containsKey("studentName"));
    }

    @Test
    void parsesRemindersAboutExamAsReminderSearchIntent() {
        IntentDTO intent = parser.parse("Reminders about exam").orElseThrow();

        assertEquals("reminders", intent.getModule());
        assertEquals("search", intent.getAction());
        assertEquals("exam", intent.getFilters().get("search"));
    }

    @Test
    void parsesExportThemAsStudentExportIntent() {
        IntentDTO intent = parser.parse("Export them").orElseThrow();

        assertEquals("students", intent.getModule());
        assertEquals("export", intent.getAction());
        assertEquals("excel", intent.getResponseType());
    }

    @Test
    void parsesExportSponsorsAsSponsorExportIntent() {
        IntentDTO intent = parser.parse("Export sponsors").orElseThrow();

        assertEquals("sponsors", intent.getModule());
        assertEquals("export", intent.getAction());
        assertEquals("excel", intent.getResponseType());
    }

    @Test
    void parsesSponsorsRegisteredInMonthAsSponsorSearchIntent() {
        IntentDTO intent = parser.parse("Show sponsors registered in Mar-2026").orElseThrow();

        assertEquals("sponsors", intent.getModule());
        assertEquals("search", intent.getAction());
        assertEquals("table", intent.getResponseType());
        assertEquals("Mar-2026", intent.getFilters().get("createdMonth"));
    }

    @Test
    void parsesExportRemindersAsReminderExportIntent() {
        IntentDTO intent = parser.parse("Export reminders").orElseThrow();

        assertEquals("reminders", intent.getModule());
        assertEquals("export", intent.getAction());
        assertEquals("excel", intent.getResponseType());
    }

    @Test
    void parsesGenderDistributionAsGraphIntent() {
        IntentDTO intent = parser.parse("Show gender distribution").orElseThrow();

        assertEquals("analytics", intent.getModule());
        assertEquals("graph", intent.getAction());
        assertEquals("graph", intent.getResponseType());
        assertEquals("gender_distribution", intent.getFilters().get("graphDataset"));
        assertEquals("donut", intent.getFilters().get("chartType"));
    }

    @Test
    void parsesMonthlySponsorRegistrationsAsGraphIntent() {
        IntentDTO intent = parser.parse("Show monthly sponsor registrations").orElseThrow();

        assertEquals("analytics", intent.getModule());
        assertEquals("graph", intent.getAction());
        assertEquals("monthly_sponsor_registrations", intent.getFilters().get("graphDataset"));
        assertEquals("line", intent.getFilters().get("chartType"));
    }

    @Test
    void parsesDistrictDrilldownAsStudentSearchIntent() {
        IntentDTO intent = parser.parse("Show students from Hyderabad district").orElseThrow();

        assertEquals("students", intent.getModule());
        assertEquals("search", intent.getAction());
        assertEquals("hyderabad", intent.getFilters().get("districtName"));
    }

    @Test
    void parsesStateOrphanDrilldownAsStudentSearchIntent() {
        IntentDTO intent = parser.parse("Show orphan students from Andhra Pradesh state").orElseThrow();

        assertEquals("students", intent.getModule());
        assertEquals("search", intent.getAction());
        assertEquals("andhra pradesh", intent.getFilters().get("stateName"));
        assertEquals(true, intent.getFilters().get("orphan"));
    }

    @Test
    void parsesTellMeAboutRahulAsStudentDetailsIntent() {
        IntentDTO intent = parser.parse("Tell me about Rahul").orElseThrow();

        assertEquals("students", intent.getModule());
        assertEquals("details", intent.getAction());
        assertEquals("rahul", intent.getFilters().get("studentName"));
        assertEquals("card", intent.getResponseType());
    }

    @Test
    void parsesWhoIsDineshReddyAsStudentDetailsIntent() {
        IntentDTO intent = parser.parse("Who is Dinesh Reddy?").orElseThrow();

        assertEquals("students", intent.getModule());
        assertEquals("details", intent.getAction());
        assertEquals("dinesh reddy", intent.getFilters().get("studentName"));
        assertEquals("card", intent.getResponseType());
    }

    @Test
    void parsesDetailsWithTrailingQualifiersAsStudentDetailsIntent() {
        IntentDTO intent = parser.parse("Tell me about Rahul or another student details query").orElseThrow();

        assertEquals("students", intent.getModule());
        assertEquals("details", intent.getAction());
        assertEquals("rahul", intent.getFilters().get("studentName"));
    }
}
