package com.saho.foundation.repository;

import com.saho.foundation.entity.Sponsor;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.query.Procedure;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;

@Repository
public interface SponsorRepository extends JpaRepository<Sponsor, Integer> {

    Sponsor findTopByEmailOrderBySponsorIdDesc(String email);

    @Modifying
    @Transactional
    @Query("update Sponsor s set s.imageUrl = :imageUrl where s.sponsorId = :sponsorId")
    void updateImageUrl(@Param("sponsorId") Integer sponsorId, @Param("imageUrl") String imageUrl);

    @Transactional
    @Procedure(procedureName = "createorupdatesponsor")
    void createOrUpdateSponsor(

            @Param("p_sponsor_id") Integer sponsorId,

            @Param("p_sponsor_name") String sponsorName,

            @Param("p_nationality") String nationality,

            @Param("p_sponsor_type") String sponsorType,

            @Param("p_email") String email,

            @Param("p_dob") LocalDate dob,

            @Param("p_ph_no") String phNo,

            @Param("p_loc") String loc,

            @Param("p_contrib") BigDecimal contrib,

            @Param("p_created_by") Integer createdBy,

            @Param("p_modified_by") Integer modifiedBy
    );

}
