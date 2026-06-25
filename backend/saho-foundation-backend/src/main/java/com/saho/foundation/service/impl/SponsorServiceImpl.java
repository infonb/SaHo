package com.saho.foundation.service.impl;

import com.saho.foundation.dto.request.SponsorRequestDto;
import com.saho.foundation.dto.response.SponsorListResponseDto;
import com.saho.foundation.dto.response.SponsorResponseDto;
import com.saho.foundation.repository.SponsorRepository;
import com.saho.foundation.service.iservices.ISponsorService;

import lombok.RequiredArgsConstructor;

import org.hibernate.Session;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Array;
import java.sql.Date;
import java.sql.CallableStatement;
import java.sql.ResultSet;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Service
@RequiredArgsConstructor
public class SponsorServiceImpl
        implements ISponsorService {

    private final SponsorRepository sponsorRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional
    public void createOrUpdateSponsor(
            SponsorRequestDto request) {

        entityManager.unwrap(Session.class).doWork(connection -> {
            try (CallableStatement statement =
                         connection.prepareCall("{ call createorupdatesponsor(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) }")) {

                statement.setInt(1, request.getSponsorId() != null ? request.getSponsorId() : 0);
                statement.setString(2, request.getSponsorName());
                statement.setString(3, normalizeNationalityForDb(request.getNationality()));
                statement.setString(4, normalizeSponsorTypeForDb(request.getSponsorType()));
                statement.setString(5, request.getEmail());
                statement.setDate(6, request.getDob() != null ? java.sql.Date.valueOf(request.getDob()) : null);
                statement.setString(7, request.getPhNo());
                statement.setString(8, request.getLoc());
                statement.setString(9, request.getContrib() != null ? request.getContrib().toString() : null);
                statement.setInt(10, request.getCreatedBy() != null ? request.getCreatedBy() : 0);
                statement.setInt(11, request.getModifiedBy() != null ? request.getModifiedBy() : 0);

                statement.execute();
            }
        });
    }

    @Override
    @Transactional(readOnly = true)
    public SponsorResponseDto getSponsorById(
            Integer sponsorId) {

        return entityManager.unwrap(Session.class).doReturningWork(connection -> {
            try (CallableStatement statement =
                         connection.prepareCall("{ call getsponsorbyid(?, ?) }")) {

                statement.setInt(1, sponsorId);
                statement.registerOutParameter(2, Types.REF_CURSOR);
                statement.execute();

                try (ResultSet resultSet = (ResultSet) statement.getObject(2)) {
                    if (!resultSet.next()) {
                        return null;
                    }

                    return mapSponsor(resultSet);
                }
            }
        });
    }

    @Override
    @Transactional(readOnly = true)
    public SponsorListResponseDto getAllSponsors(
            Integer pageNumber,
            Integer pageSize,
            String search,
            String sponsorType,
            String nationality,
            String sortColumn,
            String sortDirection) {

        return entityManager.unwrap(Session.class).doReturningWork(connection -> {
            try (CallableStatement statement =
                         connection.prepareCall("{ call public.getallsponsors_v2(?, ?, ?, ?, ?, ?, ?, ?) }")) {

                statement.setString(1, search == null || search.trim().isEmpty() ? null : search.trim());
                statement.setInt(2, pageNumber != null ? pageNumber : 1);
                statement.setInt(3, pageSize != null ? pageSize : 100);
                statement.setString(4, sponsorType == null || sponsorType.trim().isEmpty() ? null : sponsorType.trim());
                statement.setString(5, nationality == null || nationality.trim().isEmpty() ? null : nationality.trim());
                statement.setString(6, sortColumn == null || sortColumn.trim().isEmpty() ? null : sortColumn.trim());
                statement.setString(7, sortDirection == null || sortDirection.trim().isEmpty() ? null : sortDirection.trim());
                statement.registerOutParameter(8, Types.REF_CURSOR);
                statement.execute();

                List<SponsorResponseDto> sponsors =
                        new ArrayList<>();
                Integer totalCount = 0;

                try (ResultSet resultSet = (ResultSet) statement.getObject(8)) {
                    while (resultSet.next()) {
                        SponsorResponseDto sponsor = mapSponsor(resultSet);
                        sponsors.add(sponsor);
                        if (totalCount == 0) {
                            totalCount = resultSet.getInt("total_count");
                        }
                    }
                }

                SponsorListResponseDto response =
                        new SponsorListResponseDto();

                response.setPageNumber(pageNumber);
                response.setPageSize(pageSize);
                response.setItemCount(sponsors.size());
                response.setTotalCount(totalCount);
                response.setSponsors(sponsors);

                return response;
            }
        });
    }

    @Override
    @Transactional
    public void deleteSponsorById(
            Integer sponsorId,
            Integer modifiedBy) {

        entityManager.unwrap(Session.class).doWork(connection -> {
            try (CallableStatement statement =
                         connection.prepareCall("{ call deletesponsor(?, ?) }")) {

                Array sponsorIdsArray =
                        connection.createArrayOf(
                                "integer",
                                new Integer[]{sponsorId}
                        );

                statement.setArray(1, sponsorIdsArray);
                statement.setInt(2, modifiedBy);
                statement.execute();
            }
        });
    }

    private SponsorResponseDto mapSponsor(
            ResultSet resultSet) throws java.sql.SQLException {

        SponsorResponseDto response =
                new SponsorResponseDto();

        response.setSponsorId(resultSet.getInt("sponsor_id"));
        response.setSponsorName(resultSet.getString("sponsor_name"));
        response.setNationality(normalizeNationalityForUi(resultSet.getString("nationality")));
        response.setSponsorType(normalizeSponsorTypeForUi(resultSet.getString("sponsor_type")));
        response.setEmail(resultSet.getString("email"));

        Date dob = resultSet.getDate("dob");
        response.setDob(dob != null ? dob.toLocalDate() : null);

        response.setPhNo(resultSet.getString("ph_no"));
        response.setLoc(resultSet.getString("loc"));
       
        response.setContrib(resultSet.getString("contrib"));
        response.setStudentsCount(resultSet.getInt("students_count")
);

        return response;
    }

    private String normalizeNationalityForDb(String nationality) {
        if (nationality == null) {
            return "1";
        }

        String value = nationality.trim();
        if (value.isEmpty()) {
            return "1";
        }

        if ("1".equals(value) || "2".equals(value)) {
            return value;
        }

        String lower = value.toLowerCase();
        if (lower.startsWith("for")) {
            return "2";
        }

        return "1";
    }

    private String normalizeNationalityForUi(String nationality) {
        if (nationality == null) {
            return "Indian";
        }

        String value = nationality.trim();
        if (value.isEmpty()) {
            return "Indian";
        }

        if ("2".equals(value)) {
            return "Foreigner";
        }
        if ("1".equals(value)) {
            return "Indian";
        }

        String lower = value.toLowerCase();
        if (lower.startsWith("for")) {
            return "Foreigner";
        }
        if (lower.startsWith("ind")) {
            return "Indian";
        }

        return "Indian";
    }

    private String normalizeSponsorTypeForDb(String sponsorType) {
        if (sponsorType == null) {
            return "1";
        }

        String value = sponsorType.trim();
        if (value.isEmpty()) {
            return "1";
        }

        if ("1".equals(value) || "2".equals(value)) {
            return value;
        }

        String lower = value.toLowerCase();
        if (lower.startsWith("org")) {
            return "2";
        }

        return "1";
    }

    private String normalizeSponsorTypeForUi(String sponsorType) {
        if (sponsorType == null) {
            return "Individual";
        }

        String value = sponsorType.trim();
        if (value.isEmpty()) {
            return "Individual";
        }

        if ("2".equals(value)) {
            return "Organisation";
        }
        if ("1".equals(value)) {
            return "Individual";
        }

        String lower = value.toLowerCase();
        if (lower.startsWith("org")) {
            return "Organisation";
        }
        if (lower.startsWith("ind")) {
            return "Individual";
        }

        return "Individual";
    }

    @Override
    @Transactional
    public void assignSponsorToStudent(Integer studentId, Integer sponsorId, String createdBy) {
        try {
            entityManager.unwrap(Session.class).doWork(connection -> {
                try (CallableStatement statement =
                             connection.prepareCall("{ call public.assignsponsortostudent(?, ?, ?) }")) {
                    statement.setInt(1, studentId);
                    statement.setInt(2, sponsorId);
                    statement.setInt(3, Integer.parseInt(createdBy));
                    statement.execute();
                }
            });
        } catch (Exception e) {
            throw new RuntimeException("Failed to assign sponsor to student: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public void removeSponsorFromStudent(Integer studentId) {
        try {
            entityManager.unwrap(Session.class).doWork(connection -> {
                try (CallableStatement statement =
                             connection.prepareCall("{ call public.removesponsorfromstudent(?) }")) {
                    statement.setInt(1, studentId);
                    statement.execute();
                }
            });
        } catch (Exception e) {
            throw new RuntimeException("Failed to remove sponsor from student: " + e.getMessage(), e);
        }
    }

}
