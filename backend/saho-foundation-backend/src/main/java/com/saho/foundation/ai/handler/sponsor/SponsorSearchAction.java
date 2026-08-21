package com.saho.foundation.ai.handler.sponsor;

import com.saho.foundation.ai.dto.ChatResponse;
import com.saho.foundation.ai.dto.IntentDTO;
import com.saho.foundation.ai.service.ResponseBuilder;
import com.saho.foundation.dto.response.SponsorListResponseDto;
import com.saho.foundation.dto.response.SponsorResponseDto;
import com.saho.foundation.service.iservices.ISponsorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class SponsorSearchAction implements SponsorAction {

    private static final List<String> TABLE_COLUMNS = List.of(
        "Sponsor Name",
        "Type",
        "Nationality",
        "Email",
        "Phone",
        "Location",
        "Students"
    );

    private final ISponsorService sponsorService;
    private final ResponseBuilder responseBuilder;
    private final SponsorQuerySupport sponsorQuerySupport;

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
            SponsorActionContext context = sponsorQuerySupport.buildActionContext(filters);
            logAppliedFilters(context);

            SponsorListResponseDto responseDto = sponsorService.getAllSponsors(
                1,
                Integer.MAX_VALUE,
                context.search(),
                context.sponsorType(),
                context.nationality(),
                "sponsor_id",
                "ASC",
                context.createdMonth()
            );

            List<SponsorResponseDto> sponsors = responseDto != null && responseDto.getSponsors() != null
                ? responseDto.getSponsors()
                : List.of();
            sponsors = sponsorQuerySupport.filterByCreatedMonth(sponsors, context.createdMonth());

            if (sponsors.isEmpty()) {
                log.info("Sponsor search returned no rows for userMessage='{}'", userMessage);
                return responseBuilder.text("No sponsors found.");
            }

            List<List<String>> rows = sponsors.stream()
                .map(this::toTableRow)
                .toList();

            ChatResponse tableResponse = responseBuilder.table("Sponsors", TABLE_COLUMNS, rows);
            log.info("SponsorSearchAction final response: {}", tableResponse);
            return tableResponse;
        } catch (IllegalArgumentException ex) {
            log.info("Unsupported sponsor search query for userMessage='{}': {}", userMessage, ex.getMessage());
            return responseBuilder.unsupportedSponsorQuery();
        } catch (Exception ex) {
            log.error("Sponsor search failed for userMessage='{}'", userMessage, ex);
            return responseBuilder.sponsorLookupFailure();
        } finally {
            long elapsedMs = (System.nanoTime() - startedAt) / 1_000_000;
            log.info("Sponsor search action execution time: {} ms for userMessage='{}'", elapsedMs, userMessage);
        }
    }

    private void logAppliedFilters(SponsorActionContext context) {
        StringBuilder builder = new StringBuilder("Applied Sponsor Filters:\n");
        boolean any = false;

        if (StringUtils.hasText(context.search())) {
            builder.append("search = ").append(context.search()).append('\n');
            any = true;
        }
        if (StringUtils.hasText(context.sponsorType())) {
            builder.append("type = ").append(context.sponsorType()).append('\n');
            any = true;
        }
        if (StringUtils.hasText(context.nationality())) {
            builder.append("nationality = ").append(context.nationality()).append('\n');
            any = true;
        }
        if (StringUtils.hasText(context.createdMonth())) {
            builder.append("createdMonth = ").append(context.createdMonth()).append('\n');
            any = true;
        }

        if (!any) {
            builder.append("none");
        }

        log.info(builder.toString().trim());
    }

    private List<String> toTableRow(SponsorResponseDto sponsor) {
        return List.of(
            normalizeDisplayValue(sponsor.getSponsorName()),
            normalizeDisplayValue(sponsor.getSponsorType()),
            normalizeDisplayValue(sponsor.getNationality()),
            normalizeDisplayValue(sponsor.getEmail()),
            normalizeDisplayValue(sponsor.getPhNo()),
            normalizeDisplayValue(sponsor.getLoc()),
            sponsor.getStudentsCount() != null ? String.valueOf(sponsor.getStudentsCount()) : "0"
        );
    }

    private String normalizeDisplayValue(String value) {
        return StringUtils.hasText(value) ? value.trim() : "-";
    }
}
