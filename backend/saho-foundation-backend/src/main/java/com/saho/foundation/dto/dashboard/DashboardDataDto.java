package com.saho.foundation.dto.dashboard;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class DashboardDataDto {

    @JsonProperty("studentSummary")
    @JsonAlias("student_summary")
    private StudentSummaryDto studentSummary;

    @JsonProperty("villageSummary")
    @JsonAlias("village_summary")
    private VillageSummaryDto villageSummary;

    @JsonProperty("studentCategory")
    @JsonAlias("student_category")
    private StudentCategoryDto studentCategory;

    @JsonProperty("upcomingEvents")
    @JsonAlias("upcoming_events")
    private List<UpcomingEventDto> upcomingEvents;

    @JsonProperty("ageDistribution")
    @JsonAlias("age_distribution")
    private AgeDistributionDto ageDistribution;

    @JsonProperty("studentsByLocation")
    @JsonAlias("students_by_location")
    private List<LocationStatDto> studentsByLocation;

    @JsonProperty("yearlyStudentData")
    @JsonAlias("yearly_student_data")
    private List<YearlyStudentDataDto> yearlyStudentData;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor @JsonIgnoreProperties(ignoreUnknown = true)
    public static class StudentSummaryDto {
        @JsonProperty("totalStudents") @JsonAlias("total_students") private Integer totalStudents;
        @JsonProperty("boysCount")     @JsonAlias("boys_count")     private Integer boysCount;
        @JsonProperty("girlsCount")    @JsonAlias("girls_count")    private Integer girlsCount;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor @JsonIgnoreProperties(ignoreUnknown = true)
    public static class VillageSummaryDto {
        @JsonProperty("totalVillages") @JsonAlias("total_villages") private Integer totalVillages;
        @JsonProperty("totalMandals")  @JsonAlias("total_mandals")  private Integer totalMandals;
        @JsonProperty("totalDistricts") @JsonAlias("total_districts") private Integer totalDistricts;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor @JsonIgnoreProperties(ignoreUnknown = true)
    public static class StudentCategoryDto {
        @JsonProperty("orphanCount")    @JsonAlias("orphan_count")     private Integer orphanCount;
        @JsonProperty("semiOrphanCount") @JsonAlias("semi_orphan_count") private Integer semiOrphanCount;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor @JsonIgnoreProperties(ignoreUnknown = true)
    public static class UpcomingEventDto {
        @JsonProperty("remId")      @JsonAlias("rem_id")       private Integer remId;
        @JsonProperty("title")      @JsonAlias("title")        private String title;
        @JsonProperty("description") @JsonAlias("description") private String description;
        @JsonProperty("eventDate")  @JsonAlias("event_date")   private LocalDate eventDate;
        @JsonProperty("eventTime")  @JsonAlias("event_time")   private String eventTime;
        @JsonProperty("venue")      @JsonAlias("venue")       private String venue;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AgeDistributionDto {
        @JsonProperty("age10To11") @JsonAlias("age_10_to_11") private Integer age10To11;
        @JsonProperty("age12To13") @JsonAlias("age_12_to_13") private Integer age12To13;
        @JsonProperty("age14To15") @JsonAlias("age_14_to_15") private Integer age14To15;
        @JsonProperty("age16Plus") @JsonAlias("age_16_plus") private Integer age16Plus;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor @JsonIgnoreProperties(ignoreUnknown = true)
    public static class LocationStatDto {
        @JsonProperty("mandalName")  @JsonAlias("mandal_name")  private String mandalName;
        @JsonProperty("studentCount") @JsonAlias("student_count") private Integer studentCount;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor @JsonIgnoreProperties(ignoreUnknown = true)
    public static class YearlyStudentDataDto {
        @JsonProperty("year")          @JsonAlias("year")           private Integer year;
        @JsonProperty("totalStudents") @JsonAlias("total_students") private Integer totalStudents;
        @JsonProperty("boysCount")     @JsonAlias("boys_count")     private Integer boysCount;
        @JsonProperty("girlsCount")    @JsonAlias("girls_count")    private Integer girlsCount;
    }
}
