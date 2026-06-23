package com.saho.foundation.controller;

import com.saho.foundation.dto.dashboard.DashboardDataDto;
import com.saho.foundation.service.iservices.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public DashboardDataDto getDashboardData() {
        return dashboardService.getDashboardData();
    }
}
