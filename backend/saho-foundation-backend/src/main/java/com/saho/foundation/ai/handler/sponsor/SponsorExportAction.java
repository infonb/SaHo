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
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.StringJoiner;

@Slf4j
@Component
@RequiredArgsConstructor
public class SponsorExportAction implements SponsorAction {

    private final ISponsorService sponsorService;
    private final ResponseBuilder responseBuilder;
    private final SponsorQuerySupport sponsorQuerySupport;

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
            SponsorActionContext context = sponsorQuerySupport.buildActionContext(filters);
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
                log.info("Sponsor export returned no rows for userMessage='{}'", userMessage);
                return responseBuilder.text("No sponsors found to export.");
            }

            List<Integer> sponsorIds = sponsors.stream()
                .map(SponsorResponseDto::getSponsorId)
                .filter(java.util.Objects::nonNull)
                .toList();

            Map<String, Object> exportFilters = new LinkedHashMap<>();
            if (StringUtils.hasText(context.search())) {
                exportFilters.put("search", context.search());
            }
            if (StringUtils.hasText(context.sponsorType())) {
                exportFilters.put("type", context.sponsorType());
            }
            if (StringUtils.hasText(context.nationality())) {
                exportFilters.put("nationality", context.nationality());
            }
            if (StringUtils.hasText(context.createdMonth())) {
                exportFilters.put("createdMonth", context.createdMonth());
            }

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("kind", "sponsor_export");
            data.put("fileName", "sponsors.csv");
            data.put("filters", exportFilters);
            data.put("sponsorIds", sponsorIds);
            data.put("count", sponsorIds.size());

            ChatResponse response = responseBuilder.download(
                "Export Sponsors",
                data,
                buildExportMessage(sponsorIds.size(), context)
            );
            log.info("Sponsor export prepared {} ids for userMessage='{}'", sponsorIds.size(), userMessage);
            return response;
        } catch (IllegalArgumentException ex) {
            log.info("Unsupported sponsor export query for userMessage='{}': {}", userMessage, ex.getMessage());
            return responseBuilder.unsupportedSponsorQuery();
        } catch (Exception ex) {
            log.error("Sponsor export failed for userMessage='{}'", userMessage, ex);
            return responseBuilder.sponsorLookupFailure();
        } finally {
            long elapsedMs = (System.nanoTime() - startedAt) / 1_000_000;
            log.info("Sponsor export action execution time: {} ms for userMessage='{}'", elapsedMs, userMessage);
        }
    }

    private String buildExportMessage(int count, SponsorActionContext context) {
        StringJoiner joiner = new StringJoiner(", ");
        if (StringUtils.hasText(context.search())) {
            joiner.add(context.search());
        }
        if (StringUtils.hasText(context.sponsorType())) {
            joiner.add(context.sponsorType());
        }
        if (StringUtils.hasText(context.nationality())) {
            joiner.add(context.nationality());
        }
        if (StringUtils.hasText(context.createdMonth())) {
            joiner.add(context.createdMonth());
        }

        String filterSummary = joiner.length() > 0 ? " for " + joiner : "";
        return "I found " + count + " sponsors" + filterSummary + ". Your export is downloading now.";
    }
}
