package com.saho.foundation.repository;

import com.saho.foundation.dto.StudentListResponseDto;
import com.saho.foundation.dto.StudentProfileResponseDto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

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
    public List<StudentListResponseDto> getAllStudentsWithPagination(Integer pageNumber, Integer pageSize) {
        int offset = (pageNumber - 1) * pageSize;
        return jdbcTemplate.query(
                "SELECT * FROM students WHERE is_deleted = false ORDER BY student_id DESC LIMIT " + pageSize + " OFFSET " + offset,
                (rs, rowNum) -> StudentListResponseDto.builder()
                        .studentId(rs.getInt("student_id"))
                        .name(rs.getString("first_name") + " " + (rs.getString("middle_name") != null ? rs.getString("middle_name") + " " : "") + rs.getString("last_name"))
                        .emailId(rs.getString("email_id"))
                        .dob(rs.getDate("dob") != null ? rs.getDate("dob").toLocalDate() : null)
                        .gender(rs.getString("gender"))
                        .aadhaarNumber(rs.getString("aadhaar_number"))
                        .casteId((Integer) rs.getObject("caste_id"))
                        .religion(rs.getString("religion"))
                        .bloodGroup(rs.getString("blood_group"))
                        .schId((Integer) rs.getObject("sch_id"))
                        .classId((Integer) rs.getObject("class_id"))
                        .guardianId((Integer) rs.getObject("guardian_id"))
                        .siblingId(rs.getString("sibling_id"))
                        .orphanStatus(rs.getString("orphan_status"))
                        .imageUrl(rs.getString("image_url"))
                        .createdAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null)
                        .createdBy(toInteger(rs.getObject("created_by")))
                        .modifiedAt(rs.getTimestamp("modified_at") != null ? rs.getTimestamp("modified_at").toLocalDateTime() : null)
                        .modifiedBy(toInteger(rs.getObject("modified_by")))
                        .build()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<StudentProfileResponseDto> getStudentProfileById(Integer studentId) {
        String sql = """
            SELECT
                s.student_id,
                CONCAT(s.first_name, ' ', COALESCE(s.middle_name, ''), ' ', s.last_name) AS student_name,
                s.email_id, s.dob, s.gender, s.aadhaar_number, s.religion, s.blood_group,
                s.class_id, s.sibling_id, s.orphan_status, s.image_url,
                CONCAT(g.first_name, ' ', COALESCE(g.middle_name, ''), ' ', g.last_name) AS guardian_name,
                g.phone_number, g.occ, g.addr,
                sc.sch_name, sc.sch_address,
                v.vil_name, v.vil_pincode, m.mndl_name, d.dist_name, st.st_name
            FROM students s
            LEFT JOIN guardians g ON s.guardian_id = g.guardian_id
            LEFT JOIN school_master sc ON s.sch_id = sc.sch_id
            LEFT JOIN village_master v ON sc.vil_id = v.vil_id
            LEFT JOIN mandal_master m ON v.mndl_id = m.mndl_id
            LEFT JOIN district_master d ON m.dist_id = d.dist_id
            LEFT JOIN state_master st ON d.st_id = st.st_id
            WHERE s.student_id = ? AND s.is_deleted = false
            """;

        List<StudentProfileResponseDto> results = jdbcTemplate.query(sql, (rs, rowNum) ->
                StudentProfileResponseDto.builder()
                        .studentId(rs.getInt("student_id"))
                        .studentName(rs.getString("student_name"))
                        .emailId(rs.getString("email_id"))
                        .dob(rs.getDate("dob") != null ? rs.getDate("dob").toLocalDate() : null)
                        .gender(rs.getString("gender"))
                        .aadhaarNumber(rs.getString("aadhaar_number"))
                        .religion(rs.getString("religion"))
                        .bloodGroup(rs.getString("blood_group"))
                        .classId((Integer) rs.getObject("class_id"))
                        .siblingId(rs.getString("sibling_id"))
                        .orphanStatus(rs.getString("orphan_status"))
                        .imageUrl(rs.getString("image_url"))
                        .guardianName(rs.getString("guardian_name"))
                        .phoneNumber(rs.getString("phone_number"))
                        .occ(rs.getString("occ"))
                        .addr(rs.getString("addr"))
                        .schName(rs.getString("sch_name"))
                        .schAddress(rs.getString("sch_address"))
                        .vilName(rs.getString("vil_name"))
                        .vilPincode(rs.getString("vil_pincode"))
                        .mndlName(rs.getString("mndl_name"))
                        .distName(rs.getString("dist_name"))
                        .stName(rs.getString("st_name"))
                        .build(),
                studentId);

        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
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