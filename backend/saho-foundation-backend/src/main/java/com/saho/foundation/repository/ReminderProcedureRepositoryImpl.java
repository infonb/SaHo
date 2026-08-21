package com.saho.foundation.repository;

import com.saho.foundation.dto.ReminderRequestDto;
import com.saho.foundation.dto.ReminderResponseDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;

@Repository
public class ReminderProcedureRepositoryImpl implements ReminderProcedureRepository {

    private static final Logger log = LoggerFactory.getLogger(ReminderProcedureRepositoryImpl.class);

    private final JdbcTemplate jdbcTemplate;

    public ReminderProcedureRepositoryImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReminderResponseDto> getRemindersAdmin(com.saho.foundation.dto.ReminderFilterDto filter) {
        com.saho.foundation.dto.ReminderFilterDto f = filter != null ? filter : new com.saho.foundation.dto.ReminderFilterDto();
        final com.saho.foundation.dto.ReminderFilterDto safeFilter = f;
        return jdbcTemplate.execute((ConnectionCallback<List<ReminderResponseDto>>) con -> {
            String cursorName = "reminders_admin_ref";
            try (CallableStatement cs = con.prepareCall(
                    """
                    CALL public.getreminders_admin_v6(
                        CAST(? AS text),
                        CAST(? AS integer),
                        CAST(? AS integer),
                        CAST(? AS text),
                        CAST(? AS text),
                        CAST(? AS text),
                        CAST(? AS text),
                        CAST(? AS text),
                        CAST(? AS text),
                        CAST(? AS refcursor)
                    )
                    """)) {
                cs.setString(1, safeFilter.getSearch());
                cs.setInt(2, safeFilter.getPageNumber() != null ? safeFilter.getPageNumber() : 1);
                cs.setInt(3, safeFilter.getPageSize() != null ? safeFilter.getPageSize() : 100);
                cs.setString(4, safeFilter.getStateIdsCsv());
                cs.setString(5, safeFilter.getDistIdsCsv());
                cs.setString(6, safeFilter.getMndlIdsCsv());
                cs.setString(7, safeFilter.getVilIdsCsv());
                cs.setString(8, safeFilter.getSchIdsCsv());
                cs.setString(9, safeFilter.getStatus());
                cs.setString(10, cursorName);
                cs.execute();
            }

            try (Statement statement = con.createStatement();
                 ResultSet rs = statement.executeQuery("FETCH ALL IN \"" + cursorName + "\"")) {
                List<ReminderResponseDto> reminders = new ArrayList<>();
                while (rs.next()) {
                    reminders.add(mapReminder(rs));
                }
                return reminders;
            }
        });
    }

    @Override
    @Transactional(readOnly = true)
    public ReminderResponseDto getReminderAdminById(Integer remId) {
        return jdbcTemplate.execute((ConnectionCallback<ReminderResponseDto>) con -> {
            String cursorName = "reminder_admin_by_id_ref";
            try (PreparedStatement ps = con.prepareStatement(
                    "CALL public.getreminder_admin_by_id_v1(CAST(? AS integer), CAST(? AS refcursor))")) {
                ps.setInt(1, remId);
                ps.setString(2, cursorName);
                ps.execute();
            }

            try (Statement statement = con.createStatement();
                 ResultSet rs = statement.executeQuery("FETCH ALL IN \"" + cursorName + "\"")) {
                if (!rs.next()) {
                    return null;
                }
                return mapReminder(rs);
            }
        });
    }

    @Override
    @Transactional
    public Integer createOrUpdateReminderAndAssign(ReminderRequestDto requestDto) {
        return jdbcTemplate.execute((ConnectionCallback<Integer>) con -> {
            // Use explicit CALL (not JDBC escape syntax) so PostgreSQL does not try to resolve it as a function.
            try (CallableStatement cs = con.prepareCall(
                    """
                    CALL public.createorupdatereminderandassign_v7(
                        CAST(? AS integer),
                        CAST(? AS varchar),
                        CAST(? AS text),
                        CAST(? AS date),
                        CAST(? AS varchar),
                        CAST(? AS text),
                        CAST(? AS text),
                        CAST(? AS text),
                        CAST(? AS text),
                        CAST(? AS text),
                        CAST(? AS text),
                        CAST(? AS integer)
                    )
                    """)) {

                int remId = requestDto.getRemId() == null ? 0 : requestDto.getRemId();

                cs.setInt(1, remId);
                cs.registerOutParameter(1, Types.INTEGER);

                cs.setString(2, requestDto.getTitle());
                cs.setString(3, requestDto.getDescription());
                cs.setDate(4, requestDto.getEventDate() != null ? java.sql.Date.valueOf(requestDto.getEventDate()) : null);
                cs.setString(5, requestDto.getVenue());

                cs.setString(6, requestDto.getStIdCsv());
                cs.registerOutParameter(6, Types.VARCHAR);
                cs.setString(7, requestDto.getDistIdsCsv());
                cs.registerOutParameter(7, Types.VARCHAR);
                cs.setString(8, requestDto.getMndlIdsCsv());
                cs.registerOutParameter(8, Types.VARCHAR);
                cs.setString(9, requestDto.getVilIdsCsv());
                cs.registerOutParameter(9, Types.VARCHAR);
                cs.setString(10, requestDto.getSchIdsCsv());
                cs.registerOutParameter(10, Types.VARCHAR);
                cs.setString(11, requestDto.getClassIdsCsv());
                cs.registerOutParameter(11, Types.VARCHAR);

                cs.setInt(12, requestDto.getUpdatedBy() != null ? requestDto.getUpdatedBy() : 1);

                cs.execute();
                Integer savedRemId = cs.getInt(1);
                boolean hasExistingReminderId = requestDto.getRemId() != null && requestDto.getRemId() > 0;
                String reminderImage = firstNonBlank(requestDto.getImageUrl(), requestDto.getBannerImage());
                boolean hasBannerImage = reminderImage != null && !reminderImage.isBlank();
                if (savedRemId != null && savedRemId > 0 && (hasExistingReminderId || hasBannerImage)) {
                    try (PreparedStatement ps = con.prepareStatement(
                            "UPDATE reminders SET image_url = ? WHERE rem_id = ?")) {
                        ps.setString(1, reminderImage);
                        ps.setInt(2, savedRemId);
                        ps.executeUpdate();
                    }
                }
                return savedRemId;
            }
        });
    }

    @Override
    @Transactional
    public void deleteReminder(Integer remId) {
        jdbcTemplate.execute((ConnectionCallback<Void>) con -> {
            try (PreparedStatement ps = con.prepareStatement("CALL public.deletereminder(CAST(? AS integer))")) {
                ps.setInt(1, remId);
                ps.execute();
            }
            return null;
        });
    }

    @Override
    @Transactional
    public void cancelReminder(Integer remId, Integer updatedBy) {
        jdbcTemplate.execute((ConnectionCallback<Void>) con -> {
            try (PreparedStatement ps = con.prepareStatement("CALL public.cancelreminder_v1(CAST(? AS integer), CAST(? AS integer))")) {
                ps.setInt(1, remId);
                if (updatedBy == null) {
                    ps.setNull(2, Types.INTEGER);
                } else {
                    ps.setInt(2, updatedBy);
                }
                ps.execute();
            }
            return null;
        });
    }

    private ReminderResponseDto mapReminder(ResultSet rs) throws java.sql.SQLException {
        return ReminderResponseDto.builder()
                .remId(rs.getInt("rem_id"))
                .title(rs.getString("title"))
                .description(rs.getString("description"))
                .eventDate(rs.getDate("event_date") != null ? rs.getDate("event_date").toLocalDate() : null)
                .venue(rs.getString("venue"))
                .stIdCsv(getOptionalColumn(rs, "st_id_csv"))
                .distIdsCsv(getOptionalColumn(rs, "dist_ids_csv"))
                .mndlIdsCsv(getOptionalColumn(rs, "mndl_ids_csv"))
                .vilIdsCsv(getOptionalColumn(rs, "vil_ids_csv"))
                .schIdsCsv(getOptionalColumn(rs, "sch_ids_csv"))
                .classIdsCsv(getOptionalColumn(rs, "class_ids_csv"))
                .status((Boolean) getOptionalObject(rs, "status"))
                .createdBy((Integer) getOptionalObject(rs, "created_by"))
                .createdAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null)
                .updatedAt(rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null)
                .imageUrl(firstNonBlank(
                        getOptionalColumn(rs, "image_url"),
                        getOptionalColumn(rs, "banner_image")
                ))
                .bannerImage(firstNonBlank(
                        getOptionalColumn(rs, "image_url"),
                        getOptionalColumn(rs, "banner_image")
                ))
                .totalCount(rs.getObject("total_count") != null ? rs.getInt("total_count") : null)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReminderResponseDto> getStudentReminders(Integer studentId) {
        String sql = """
            SELECT r.rem_id, r.title, r.description, r.event_date, r.venue,
                   r.st_id_csv, r.dist_ids_csv, r.mndl_ids_csv, r.vil_ids_csv,
                   r.sch_ids_csv, r.class_ids_csv, r.status, r.created_by,
                   r.created_at, r.updated_at,
                   r.image_url,
                   0 AS total_count
            FROM student_reminders sr
            JOIN reminders r ON sr.rem_id = r.rem_id
            WHERE sr.std_id = ?
              AND sr.is_deleted = FALSE
              AND r.is_deleted = FALSE
            ORDER BY r.event_date DESC
            """;
        log.debug("getStudentReminders query for studentId={}: {}", studentId, sql.replace("?", String.valueOf(studentId)));
        try {
            List<ReminderResponseDto> result = jdbcTemplate.query(sql, (rs, rowNum) -> mapReminder(rs), studentId);
            log.debug("Repository returned {} reminders for studentId={}", result.size(), studentId);
            for (ReminderResponseDto r : result) {
                log.debug("  Reminder: remId={}, title='{}', eventDate={}", r.getRemId(), r.getTitle(), r.getEventDate());
            }
            return result;
        } catch (Exception e) {
            log.error("Exception in getStudentReminders for studentId={}: {}", studentId, e.getMessage(), e);
            throw e;
        }
    }

    private String getOptionalColumn(ResultSet rs, String columnName) {
        try {
            rs.findColumn(columnName);
            return rs.getString(columnName);
        } catch (Exception ex) {
            return null;
        }
    }

    private Object getOptionalObject(ResultSet rs, String columnName) {
        try {
            rs.findColumn(columnName);
            return rs.getObject(columnName);
        } catch (Exception ex) {
            return null;
        }
    }

    private String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first;
        }
        if (second != null && !second.isBlank()) {
            return second;
        }
        return null;
    }
}
