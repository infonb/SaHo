package com.saho.foundation.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class DashboardProcedureRepositoryImpl implements DashboardProcedureRepository {

    private final JdbcTemplate jdbcTemplate;

    public DashboardProcedureRepositoryImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional(readOnly = true)
    public String getDashboardDataJson() {
        return jdbcTemplate.queryForObject("SELECT public.dashboard_data()::text", String.class);
    }
}
