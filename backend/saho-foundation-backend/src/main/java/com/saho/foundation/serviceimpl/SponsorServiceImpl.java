package com.saho.foundation.serviceimpl;

import com.saho.foundation.dto.request.SponsorRequestDto;
import com.saho.foundation.dto.response.SponsorListResponseDto;
import com.saho.foundation.dto.response.SponsorResponseDto;
import com.saho.foundation.repository.SponsorRepository;
import com.saho.foundation.service.ISponsorService;

import lombok.RequiredArgsConstructor;

import org.hibernate.Session;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
                statement.setString(3, request.getNationality());
                statement.setString(4, request.getSponsorType());
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
            Integer pageSize) {

        return entityManager.unwrap(Session.class).doReturningWork(connection -> {
            try (CallableStatement statement =
                         connection.prepareCall("{ call getallsponsorswithpagination_v1(?, ?, ?) }")) {

                statement.setInt(1, pageNumber);
                statement.setInt(2, pageSize);
                statement.registerOutParameter(3, Types.REF_CURSOR);
                statement.execute();

                List<SponsorResponseDto> sponsors =
                        new ArrayList<>();

                try (ResultSet resultSet = (ResultSet) statement.getObject(3)) {
                    while (resultSet.next()) {
                        sponsors.add(mapSponsor(resultSet));
                    }
                }

                SponsorListResponseDto response =
                        new SponsorListResponseDto();

                response.setPageNumber(pageNumber);
                response.setPageSize(pageSize);
                response.setItemCount(sponsors.size());
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
        response.setNationality(resultSet.getString("nationality"));
        response.setSponsorType(resultSet.getString("sponsor_type"));
        response.setEmail(resultSet.getString("email"));

        Date dob = resultSet.getDate("dob");
        response.setDob(dob != null ? dob.toLocalDate() : null);

        response.setPhNo(resultSet.getString("ph_no"));
        response.setLoc(resultSet.getString("loc"));

        BigDecimal contrib = resultSet.getBigDecimal("contrib");
        response.setContrib(contrib);

        return response;
    }


}
