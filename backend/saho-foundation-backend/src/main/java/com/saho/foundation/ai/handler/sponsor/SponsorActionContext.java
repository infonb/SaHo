package com.saho.foundation.ai.handler.sponsor;

import java.util.Map;

public record SponsorActionContext(
    String search,
    String sponsorType,
    String nationality,
    String createdMonth,
    Map<String, Object> rawFilters
) {
}
