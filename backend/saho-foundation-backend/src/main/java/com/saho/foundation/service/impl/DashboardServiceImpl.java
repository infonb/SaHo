package com.saho.foundation.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.saho.foundation.dto.dashboard.DashboardDataDto;
import com.saho.foundation.repository.DashboardProcedureRepository;
import com.saho.foundation.service.iservices.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final DashboardProcedureRepository dashboardProcedureRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public DashboardDataDto getDashboardData() {
        String json = dashboardProcedureRepository.getDashboardDataJson();
        if (json == null || json.isBlank()) {
            return DashboardDataDto.builder().build();
        }
        try {
            return objectMapper.readValue(json, DashboardDataDto.class);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to parse dashboard data from database function", ex);
        }
    }
}
