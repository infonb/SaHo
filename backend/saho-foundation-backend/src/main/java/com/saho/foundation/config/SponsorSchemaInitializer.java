package com.saho.foundation.config;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SponsorSchemaInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SponsorSchemaInitializer.class);

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute("ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS image_url TEXT");
            log.info("Ensured sponsors.image_url column exists");
            jdbcTemplate.execute("ALTER TABLE reminders ADD COLUMN IF NOT EXISTS image_url TEXT");
            log.info("Ensured reminders.image_url column exists");
        } catch (Exception ex) {
            log.warn("Unable to ensure image_url columns exist for sponsors/reminders", ex);
        }
    }
}
