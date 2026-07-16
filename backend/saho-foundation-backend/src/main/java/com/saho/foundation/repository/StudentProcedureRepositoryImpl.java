package com.saho.foundation.repository;

import com.saho.foundation.dto.StudentListResponseDto;
import com.saho.foundation.dto.StudentProfileResponseDto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class StudentProcedureRepositoryImpl implements StudentProcedureRepository {

    private final JdbcTemplate jdbcTemplate;

    public StudentProcedureRepositoryImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentListResponseDto> getAllStudentsWithPagination(
            String search,
            Integer pageNumber,
            Integer pageSize,
            String gender,
            String classId,
            String orphanStatus,
            String stId,
            String distId,
            String mndlId,
            String vilId,
            String schId,
            String sortColumn,
            String sortDirection
    ) {
        return getStudentsFromProcedure(search, pageNumber, pageSize, gender, classId, orphanStatus, stId, distId, mndlId, vilId, schId, sortColumn, sortDirection);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<StudentProfileResponseDto> getStudentProfileById(Integer studentId) {
        String sql = """
            SELECT
                s.student_id,
                CONCAT_WS(' ', s.first_name, s.last_name) AS student_name,
                s.email_id, s.dob, s.gender, s.aadhaar_number, s.caste_id, cm.caste_name, s.religion, s.blood_group,
                s.class_id, clm.class_name, s.sibling_id, s.orphan_status, s.image_url,
            CONCAT_WS(' ', g.first_name, g.last_name) AS guardian_name,
                g.first_name AS guardian_first_name,
                g.last_name AS guardian_last_name,
                g.phone_number, rm.relationship_name, g.occ, g.addr,
                sc.sch_name, sc.sch_address,
                v.vil_name, v.vil_pincode, m.mndl_name, d.dist_name, st.st_name
            FROM students s
            LEFT JOIN class_master clm ON s.class_id = clm.class_id
            LEFT JOIN caste_master cm ON s.caste_id = cm.caste_id
        LEFT JOIN guardians g ON s.guardian_id = g.guardian_id
            LEFT JOIN relationship_master rm ON g.relationship_id = rm.relationship_id
            LEFT JOIN school_master sc ON s.sch_id = sc.sch_id
            LEFT JOIN village_master v ON sc.vil_id = v.vil_id
            LEFT JOIN mandal_master m ON v.mndl_id = m.mndl_id
            LEFT JOIN district_master d ON m.dist_id = d.dist_id
            LEFT JOIN state_master st ON d.st_id = st.st_id
            WHERE s.student_id = ? AND s.is_deleted = false
            """;

        List<StudentProfileResponseDto> results = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> mapStudentProfileResponse(rs),
                studentId
        );

        return results == null || results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    private StudentProfileResponseDto mapStudentProfileResponse(ResultSet rs) throws java.sql.SQLException {
        return StudentProfileResponseDto.builder()
                .studentId(rs.getInt("student_id"))
                .studentName(rs.getString("student_name"))
                .emailId(rs.getString("email_id"))
                .dob(rs.getDate("dob") != null ? rs.getDate("dob").toLocalDate() : null)
                .gender(rs.getString("gender"))
                .aadhaarNumber(rs.getString("aadhaar_number"))
                .casteId((Integer) rs.getObject("caste_id"))
                .casteName(rs.getString("caste_name"))
                .religion(rs.getString("religion"))
                .bloodGroup(rs.getString("blood_group"))
                .classId((Integer) rs.getObject("class_id"))
                .className(rs.getString("class_name"))
                .siblingId(rs.getString("sibling_id"))
                .orphanStatus(rs.getString("orphan_status"))
                .imageUrl(rs.getString("image_url"))
                .guardianName(rs.getString("guardian_name"))
                .guardianFirstName(rs.getString("guardian_first_name"))
                .guardianLastName(rs.getString("guardian_last_name"))
                .phoneNumber(rs.getString("phone_number"))
                .guardianRelationName(rs.getString("relationship_name"))
                .occ(rs.getString("occ"))
                .addr(rs.getString("addr"))
                .schName(rs.getString("sch_name"))
                .schAddress(rs.getString("sch_address"))
                .vilName(rs.getString("vil_name"))
                .vilPincode(rs.getString("vil_pincode"))
                .mndlName(rs.getString("mndl_name"))
                .distName(rs.getString("dist_name"))
                .stName(rs.getString("st_name"))
                .build();
    }

    private StudentListResponseDto mapStudentListResponse(ResultSet rs) throws java.sql.SQLException {
        return StudentListResponseDto.builder()
                .studentId(rs.getInt("student_id"))
                .name(rs.getString("student_name"))
                .emailId(getOptionalColumn(rs, "email_id"))
                .dob(rs.getDate("dob") != null ? rs.getDate("dob").toLocalDate() : null)
                .gender(rs.getString("gender"))
                .aadhaarNumber(getOptionalColumn(rs, "aadhaar_number"))
                .casteId((Integer) getOptionalObject(rs, "caste_id"))
                .religion(getOptionalColumn(rs, "religion"))
                .bloodGroup(getOptionalColumn(rs, "blood_group"))
                .schId((Integer) getOptionalObject(rs, "sch_id"))
                .classId((Integer) getOptionalObject(rs, "class_id"))
                .guardianId((Integer) getOptionalObject(rs, "guardian_id"))
                .schName(getOptionalColumn(rs, "sch_name"))
                .schAddress(getOptionalColumn(rs, "sch_address"))
                .className(getOptionalColumn(rs, "class_name"))
                .guardianName(getOptionalColumn(rs, "guardian_name"))
                .guardianRelationName(getOptionalColumn(rs, "relationship_name"))
                .vilName(getOptionalColumn(rs, "vil_name"))
                .mndlName(getOptionalColumn(rs, "mndl_name"))
                .distName(getOptionalColumn(rs, "dist_name"))
                .stName(getOptionalColumn(rs, "st_name"))
                .siblingId(getOptionalColumn(rs, "sibling_id"))
                .orphanStatus(getOptionalColumn(rs, "orphan_status"))
                .sponsorId((Integer) getOptionalObject(rs, "sponsor_id"))
                .sponsorName(getOptionalColumn(rs, "sponsor_name"))
                .totalCount((Integer) getOptionalObject(rs, "total_count"))
                .boysCount((Integer) getOptionalObject(rs, "boys_count"))
                .girlsCount((Integer) getOptionalObject(rs, "girls_count"))
                .sponsoredCount((Integer) getOptionalObject(rs, "sponsored_count"))
                .orphansCount((Integer) getOptionalObject(rs, "orphans_count"))
                .imageUrl(getOptionalColumn(rs, "image_url"))
                .createdAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null)
                .createdBy(toInteger(getOptionalObject(rs, "created_by")))
                .modifiedAt(rs.getTimestamp("modified_at") != null ? rs.getTimestamp("modified_at").toLocalDateTime() : null)
                .modifiedBy(toInteger(getOptionalObject(rs, "modified_by")))
                .build();
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

    private List<StudentListResponseDto> getStudentsFromProcedure(
            String search,
            Integer pageNumber,
            Integer pageSize,
            String gender,
            String classId,
            String orphanStatus,
            String stId,
            String distId,
            String mndlId,
            String vilId,
            String schId,
            String sortColumn,
            String sortDirection
    ) {
        return jdbcTemplate.execute((ConnectionCallback<List<StudentListResponseDto>>) con -> {
            String cursorName = "student_list_ref";
            int resolvedPageNumber = pageNumber != null && pageNumber > 0 ? pageNumber : 1;
            int resolvedPageSize = pageSize != null && pageSize > 0 ? pageSize : 10;

            try (PreparedStatement ps = con.prepareStatement(
                    """
                    CALL public.getallstudents_v3(
                        CAST(? AS text),
                        CAST(? AS integer),
                        CAST(? AS integer),
                        CAST(? AS text),
                        CAST(? AS text),
                        CAST(? AS text),
                        CAST(? AS text),
                        CAST(? AS text),
                        CAST(? AS text),
                        CAST(? AS text),
                        CAST(? AS text),
                        CAST(? AS text),
                        CAST(? AS text),
                        CAST(? AS refcursor)
                    )
                    """)) {
                ps.setString(1, emptyToNull(search));
                ps.setInt(2, resolvedPageNumber);
                ps.setInt(3, resolvedPageSize);
                ps.setString(4, emptyToNull(gender));
                ps.setString(5, emptyToNull(classId));
                ps.setString(6, emptyToNull(orphanStatus));
                ps.setString(7, emptyToNull(stId));
                ps.setString(8, emptyToNull(distId));
                ps.setString(9, emptyToNull(mndlId));
                ps.setString(10, emptyToNull(vilId));
                ps.setString(11, emptyToNull(schId));
                ps.setString(12, emptyToNull(sortColumn));
                ps.setString(13, emptyToNull(sortDirection));
                ps.setString(14, cursorName);
                ps.execute();
            }

            try (Statement statement = con.createStatement();
                 ResultSet rs = statement.executeQuery("FETCH ALL IN \"" + cursorName + "\"")) {
                List<StudentListResponseDto> students = new ArrayList<>();
                while (rs.next()) {
                    students.add(mapStudentListResponse(rs));
                }
                return students;
            }
        });
    }

    private String emptyToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private Integer toInteger(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        return Integer.valueOf(value.toString());
    }
}
