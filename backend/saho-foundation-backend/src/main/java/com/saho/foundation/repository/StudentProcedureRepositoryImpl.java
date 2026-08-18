package com.saho.foundation.repository;

import com.saho.foundation.dto.StudentAcademicResponseDto;
import com.saho.foundation.dto.StudentListResponseDto;
import com.saho.foundation.dto.StudentProfileResponseDto;
import com.saho.foundation.entity.StudentAcademic;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

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
            String academicYearId,
            String parentType,
            String parentOccupation,
            String sortColumn,
            String sortDirection
    ) {
        return getStudentsFromProcedure(search, pageNumber, pageSize, gender, classId, orphanStatus, stId, distId, mndlId, vilId, schId, academicYearId, parentType, parentOccupation, sortColumn, sortDirection);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<StudentProfileResponseDto> getStudentProfileById(Integer studentId) {
        try {
            String cursorName = "student_profile_ref";
            AtomicReference<StudentProfileResponseDto> cachedProfile = new AtomicReference<>();
            jdbcTemplate.execute((ConnectionCallback<Void>) con -> {
                try (PreparedStatement ps = con.prepareStatement("""
                    CALL public.getstudentprofilebyid_v2(
                        CAST(? AS integer),
                        CAST(? AS refcursor)
                    )
                    """)) {
                    ps.setInt(1, studentId);
                    ps.setString(2, cursorName);
                    ps.execute();
                }

                try (Statement statement = con.createStatement();
                     ResultSet rs = statement.executeQuery("FETCH ALL IN \"" + cursorName + "\"")) {
                    if (rs.next()) {
                        cachedProfile.set(mapStudentProfileResponse(rs));
                    }
                }
                try (Statement closeStmt = con.createStatement()) {
                    closeStmt.execute("CLOSE \"" + cursorName + "\"");
                }
                return null;
            });
            return Optional.ofNullable(cachedProfile.get());
        } catch (Exception ex) {
            return fallbackStudentProfileById(studentId);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<StudentAcademic> getStudentAcademicById(Integer studentId) {
        try {
            String cursorName = "student_academic_ref";
            AtomicReference<StudentAcademic> cachedAcademic = new AtomicReference<>();
            jdbcTemplate.execute((ConnectionCallback<Void>) con -> {
                try (PreparedStatement ps = con.prepareStatement("""
                    CALL public.getstudentacademicbyid(
                        CAST(? AS integer),
                        CAST(? AS refcursor)
                    )
                    """)) {
                    ps.setInt(1, studentId);
                    ps.setString(2, cursorName);
                    ps.execute();
                }

                try (Statement statement = con.createStatement();
                     ResultSet rs = statement.executeQuery("FETCH ALL IN \"" + cursorName + "\"")) {
                    if (rs.next()) {
                        cachedAcademic.set(mapStudentAcademic(rs));
                    }
                }
                try (Statement closeStmt = con.createStatement()) {
                    closeStmt.execute("CLOSE \"" + cursorName + "\"");
                }
                return null;
            });
            if (cachedAcademic.get() != null) {
                return Optional.of(cachedAcademic.get());
            }
        } catch (Exception ignored) {
            // Fall back to direct table access below.
        }
        return fallbackStudentAcademicByStudentId(studentId);
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
            String academicYearId,
            String parentType,
            String parentOccupation,
            String sortColumn,
            String sortDirection
    ) {
        return jdbcTemplate.execute((ConnectionCallback<List<StudentListResponseDto>>) con -> {
            String cursorName = "student_list_ref";
            int resolvedPageNumber = pageNumber != null && pageNumber > 0 ? pageNumber : 1;
            int resolvedPageSize = pageSize != null && pageSize > 0 ? pageSize : 10;

            try (PreparedStatement ps = con.prepareStatement("""
                    CALL public.getallstudents_v5(
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
                ps.setString(12, emptyToNull(academicYearId));
                ps.setString(13, emptyToNull(parentType));
                ps.setString(14, emptyToNull(parentOccupation));
                ps.setString(15, emptyToNull(sortColumn));
                ps.setString(16, emptyToNull(sortDirection));
                ps.setString(17, cursorName);
                ps.execute();
            }

            try (Statement statement = con.createStatement();
                 ResultSet rs = statement.executeQuery("FETCH ALL IN \"" + cursorName + "\"")) {
                List<StudentListResponseDto> students = new ArrayList<>();
                while (rs.next()) {
                    students.add(mapStudentListResponse(rs));
                }
                return students;
            } finally {
                try (Statement closeStmt = con.createStatement()) {
                    closeStmt.execute("CLOSE \"" + cursorName + "\"");
                } catch (Exception ignored) {
                }
            }
        });
    }

    private Optional<StudentProfileResponseDto> fallbackStudentProfileById(Integer studentId) {
        String sql = """
            SELECT
                s.student_id,
                CONCAT_WS(' ', s.first_name, s.last_name) AS student_name,
                s.email_id,
                s.dob,
                s.gender,
                s.aadhaar_number,
                s.caste_id,
                cm.caste_name,
                s.religion,
                s.blood_group,
                sa.student_academic_id,
                sa.school_id,
                sc.sch_name AS school_name,
                sa.class_id,
                clm.class_name,
                clm.course_id,
                sa.academic_year_id,
                ay.academic_year_name,
                sa.roll_number,
                sa.admission_type,
                sa.status,
                sa.remarks,
                sa.is_active AS academic_is_active,
                sa.is_deleted AS academic_is_deleted,
                sa.created_at AS academic_created_at,
                sa.created_by AS academic_created_by,
                sa.updated_at AS academic_updated_at,
                sa.updated_by AS academic_updated_by,
                s.family_id,
                sf.father_name,
                sf.father_occupation,
                sf.father_status,
                sf.mother_name,
                sf.mother_occupation,
                sf.mother_status,
                s.sibling_id,
                s.orphan_status,
                s.image_url,
                s.guardian_id,
                CONCAT_WS(' ', g.first_name, g.last_name) AS guardian_name,
                g.first_name AS guardian_first_name,
                g.last_name AS guardian_last_name,
                g.phone_number AS guardian_phone,
                rm.relationship_name,
                g.occ,
                g.addr,
                sc.sch_name,
                sc.sch_address,
                v.vil_name,
                v.vil_pincode,
                m.mndl_name,
                d.dist_name,
                st.st_name
            FROM students s
            LEFT JOIN student_academic sa ON sa.student_id = s.student_id AND sa.is_deleted = false
            LEFT JOIN class_master clm ON sa.class_id = clm.class_id
            LEFT JOIN academic_year ay ON sa.academic_year_id = ay.academic_year_id
            LEFT JOIN caste_master cm ON s.caste_id = cm.caste_id
            LEFT JOIN student_family sf ON s.family_id = sf.family_id
            LEFT JOIN guardians g ON s.guardian_id = g.guardian_id
            LEFT JOIN relationship_master rm ON g.relationship_id = rm.relationship_id
            LEFT JOIN school_master sc ON sa.school_id = sc.sch_id
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

        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    private Optional<StudentAcademic> fallbackStudentAcademicByStudentId(Integer studentId) {
        String sql = """
            SELECT student_academic_id, student_id, academic_year_id, school_id, class_id,
                   roll_number, admission_type, status, remarks, is_active, is_deleted,
                   created_at, created_by, updated_at, updated_by
            FROM student_academic
            WHERE student_id = ? AND is_deleted = false
            ORDER BY student_academic_id DESC
            LIMIT 1
            """;

        List<StudentAcademic> results = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> mapStudentAcademic(rs),
                studentId
        );
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    private StudentProfileResponseDto mapStudentProfileResponse(ResultSet rs) throws java.sql.SQLException {
        StudentAcademicResponseDto academicDetails = mapAcademicResponse(rs);

        return StudentProfileResponseDto.builder()
                .studentId(getInteger(rs, "student_id"))
                .studentName(getString(rs, "student_name"))
                .emailId(getString(rs, "email_id"))
                .dob(getDate(rs, "dob"))
                .gender(getString(rs, "gender"))
                .aadhaarNumber(getString(rs, "aadhaar_number"))
                .casteId(getInteger(rs, "caste_id"))
                .casteName(getString(rs, "caste_name"))
                .religion(getString(rs, "religion"))
                .bloodGroup(getString(rs, "blood_group"))
                .studentAcademicId(getInteger(rs, "student_academic_id"))
                .schoolId(getInteger(rs, "school_id", "sch_id"))
                .schoolName(getString(rs, "school_name", "sch_name"))
                .courseId(getInteger(rs, "course_id"))
                .classId(getInteger(rs, "class_id"))
                .className(getString(rs, "class_name"))
                .academicYearId(getInteger(rs, "academic_year_id"))
                .academicYearName(getString(rs, "academic_year_name"))
                .rollNumber(getString(rs, "roll_number"))
                .admissionType(getString(rs, "admission_type"))
                .status(getString(rs, "status"))
                .remarks(getString(rs, "remarks"))
                .academicIsActive(getBoolean(rs, "academic_is_active"))
                .academicIsDeleted(getBoolean(rs, "academic_is_deleted"))
                .academicCreatedAt(getTimestamp(rs, "academic_created_at"))
                .academicCreatedBy(getInteger(rs, "academic_created_by"))
                .academicUpdatedAt(getTimestamp(rs, "academic_updated_at"))
                .academicUpdatedBy(getInteger(rs, "academic_updated_by"))
                .familyId(getInteger(rs, "family_id"))
                .fatherName(getString(rs, "father_name"))
                .fatherOccupation(getString(rs, "father_occupation"))
                .fatherStatus(getString(rs, "father_status"))
                .motherName(getString(rs, "mother_name"))
                .motherOccupation(getString(rs, "mother_occupation"))
                .motherStatus(getString(rs, "mother_status"))
                .siblingId(getString(rs, "sibling_id"))
                .orphanStatus(getString(rs, "orphan_status"))
                .imageUrl(getString(rs, "image_url"))
                .guardianId(getInteger(rs, "guardian_id"))
                .guardianName(getString(rs, "guardian_name"))
                .guardianFirstName(getString(rs, "guardian_first_name"))
                .guardianLastName(getString(rs, "guardian_last_name"))
                .guardianPhone(getString(rs, "guardian_phone"))
                .phoneNumber(getString(rs, "guardian_phone"))
                .guardianRelationName(getString(rs, "relationship_name"))
                .relationshipName(getString(rs, "relationship_name"))
                .occ(getString(rs, "occ"))
                .addr(getString(rs, "addr"))
                .schName(getString(rs, "sch_name", "school_name"))
                .schAddress(getString(rs, "sch_address"))
                .vilName(getString(rs, "vil_name"))
                .vilPincode(getString(rs, "vil_pincode"))
                .mndlName(getString(rs, "mndl_name"))
                .distName(getString(rs, "dist_name"))
                .stName(getString(rs, "st_name"))
                .academicDetails(academicDetails)
                .build();
    }

    private StudentListResponseDto mapStudentListResponse(ResultSet rs) throws java.sql.SQLException {
        StudentAcademicResponseDto academicDetails = mapAcademicResponse(rs);

        return StudentListResponseDto.builder()
                .studentId(getInteger(rs, "student_id"))
                .name(getString(rs, "student_name"))
                .emailId(getString(rs, "email_id"))
                .dob(getDate(rs, "dob"))
                .gender(getString(rs, "gender"))
                .aadhaarNumber(getString(rs, "aadhaar_number"))
                .casteId(getInteger(rs, "caste_id"))
                .religion(getString(rs, "religion"))
                .bloodGroup(getString(rs, "blood_group"))
                .studentAcademicId(getInteger(rs, "student_academic_id"))
                .schId(getInteger(rs, "school_id", "sch_id"))
                .schoolId(getInteger(rs, "school_id", "sch_id"))
                .classId(getInteger(rs, "class_id"))
                .academicYearId(getInteger(rs, "academic_year_id"))
                .academicYearName(getString(rs, "academic_year_name"))
                .rollNumber(getString(rs, "roll_number"))
                .admissionType(getString(rs, "admission_type"))
                .status(getString(rs, "status"))
                .remarks(getString(rs, "remarks"))
                .academicIsActive(getBoolean(rs, "academic_is_active"))
                .academicIsDeleted(getBoolean(rs, "academic_is_deleted"))
                .academicCreatedAt(getTimestamp(rs, "academic_created_at"))
                .academicCreatedBy(getInteger(rs, "academic_created_by"))
                .academicUpdatedAt(getTimestamp(rs, "academic_updated_at"))
                .academicUpdatedBy(getInteger(rs, "academic_updated_by"))
                .familyId(getInteger(rs, "family_id"))
                .fatherName(getString(rs, "father_name"))
                .fatherOccupation(getString(rs, "father_occupation"))
                .fatherStatus(getString(rs, "father_status"))
                .motherName(getString(rs, "mother_name"))
                .motherOccupation(getString(rs, "mother_occupation"))
                .motherStatus(getString(rs, "mother_status"))
                .guardianId(getInteger(rs, "guardian_id"))
                .schAddress(getString(rs, "sch_address"))
                .schName(getString(rs, "sch_name", "school_name"))
                .className(getString(rs, "class_name"))
                .guardianName(getString(rs, "guardian_name"))
                .guardianPhone(getString(rs, "guardian_phone"))
                .guardianRelationName(getString(rs, "relationship_name"))
                .relationshipName(getString(rs, "relationship_name"))
                .vilName(getString(rs, "vil_name"))
                .mndlName(getString(rs, "mndl_name"))
                .distName(getString(rs, "dist_name"))
                .stName(getString(rs, "st_name"))
                .siblingId(getString(rs, "sibling_id"))
                .orphanStatus(getString(rs, "orphan_status"))
                .sponsorId(getInteger(rs, "sponsor_id"))
                .sponsorName(getString(rs, "sponsor_name"))
                .totalCount(getInteger(rs, "total_count"))
                .boysCount(getInteger(rs, "boys_count"))
                .girlsCount(getInteger(rs, "girls_count"))
                .sponsoredCount(getInteger(rs, "sponsored_count"))
                .orphansCount(getInteger(rs, "orphans_count"))
                .imageUrl(getString(rs, "image_url"))
                .createdAt(getTimestamp(rs, "created_at"))
                .createdBy(getInteger(rs, "created_by"))
                .modifiedAt(getTimestamp(rs, "modified_at"))
                .modifiedBy(getInteger(rs, "modified_by"))
                .academicDetails(academicDetails)
                .build();
    }

    private StudentAcademicResponseDto mapAcademicResponse(ResultSet rs) throws java.sql.SQLException {
        if (!hasColumn(rs, "student_academic_id")) {
            return null;
        }

        return StudentAcademicResponseDto.builder()
                .studentAcademicId(getInteger(rs, "student_academic_id"))
                .studentId(getInteger(rs, "student_id"))
                .academicYearId(getInteger(rs, "academic_year_id"))
                .academicYearName(getString(rs, "academic_year_name"))
                .schoolId(getInteger(rs, "school_id", "sch_id"))
                .schoolName(getString(rs, "school_name", "sch_name"))
                .courseId(getInteger(rs, "course_id"))
                .classId(getInteger(rs, "class_id"))
                .className(getString(rs, "class_name"))
                .rollNumber(getString(rs, "roll_number"))
                .admissionType(getString(rs, "admission_type"))
                .status(getString(rs, "status"))
                .remarks(getString(rs, "remarks"))
                .isActive(getBoolean(rs, "academic_is_active"))
                .isDeleted(getBoolean(rs, "academic_is_deleted"))
                .createdAt(getTimestamp(rs, "academic_created_at"))
                .createdBy(getInteger(rs, "academic_created_by"))
                .updatedAt(getTimestamp(rs, "academic_updated_at"))
                .updatedBy(getInteger(rs, "academic_updated_by"))
                .build();
    }

    private StudentAcademic mapStudentAcademic(ResultSet rs) throws java.sql.SQLException {
        return StudentAcademic.builder()
                .studentAcademicId(getInteger(rs, "student_academic_id"))
                .studentId(getInteger(rs, "student_id"))
                .academicYearId(getInteger(rs, "academic_year_id"))
                .schoolId(getInteger(rs, "school_id", "sch_id"))
                .classId(getInteger(rs, "class_id"))
                .rollNumber(getString(rs, "roll_number"))
                .admissionType(getString(rs, "admission_type"))
                .status(getString(rs, "status"))
                .remarks(getString(rs, "remarks"))
                .isActive(getBoolean(rs, "is_active"))
                .isDeleted(getBoolean(rs, "is_deleted"))
                .createdAt(getTimestamp(rs, "created_at"))
                .createdBy(getInteger(rs, "created_by"))
                .updatedAt(getTimestamp(rs, "updated_at"))
                .updatedBy(getInteger(rs, "updated_by"))
                .build();
    }

    private boolean hasColumn(ResultSet rs, String columnName) {
        try {
            rs.findColumn(columnName);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    private String getString(ResultSet rs, String columnName) throws java.sql.SQLException {
        return hasColumn(rs, columnName) ? rs.getString(columnName) : null;
    }

    private String getString(ResultSet rs, String primaryColumn, String fallbackColumn) throws java.sql.SQLException {
        String value = getString(rs, primaryColumn);
        return value != null ? value : getString(rs, fallbackColumn);
    }

    private Integer getInteger(ResultSet rs, String columnName) throws java.sql.SQLException {
        if (!hasColumn(rs, columnName)) {
            return null;
        }
        Object value = rs.getObject(columnName);
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        return Integer.valueOf(value.toString());
    }

    private Integer getInteger(ResultSet rs, String primaryColumn, String fallbackColumn) throws java.sql.SQLException {
        Integer value = getInteger(rs, primaryColumn);
        return value != null ? value : getInteger(rs, fallbackColumn);
    }

    private Boolean getBoolean(ResultSet rs, String columnName) throws java.sql.SQLException {
        if (!hasColumn(rs, columnName)) {
            return null;
        }
        Object value = rs.getObject(columnName);
        if (value == null) {
            return null;
        }
        if (value instanceof Boolean bool) {
            return bool;
        }
        if (value instanceof Number number) {
            return number.intValue() != 0;
        }
        return Boolean.valueOf(value.toString());
    }

    private LocalDate getDate(ResultSet rs, String columnName) throws java.sql.SQLException {
        if (!hasColumn(rs, columnName)) {
            return null;
        }
        java.sql.Date date = rs.getDate(columnName);
        return date != null ? date.toLocalDate() : null;
    }

    private LocalDateTime getTimestamp(ResultSet rs, String columnName) throws java.sql.SQLException {
        if (!hasColumn(rs, columnName)) {
            return null;
        }
        java.sql.Timestamp timestamp = rs.getTimestamp(columnName);
        return timestamp != null ? timestamp.toLocalDateTime() : null;
    }

    private String emptyToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
