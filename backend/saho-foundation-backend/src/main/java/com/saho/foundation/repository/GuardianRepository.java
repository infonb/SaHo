package com.saho.foundation.repository;

import com.saho.foundation.entity.Guardian;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.query.Procedure;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GuardianRepository extends JpaRepository<Guardian, Integer> {

    @Procedure(procedureName = "createorupdateguardian")
    void createOrUpdateGuardian(
            @Param("p_guardian_id") Integer guardianId,
            @Param("p_first_name") String firstName,
            @Param("p_last_name") String lastName,
            @Param("p_phone_number") String phoneNumber,
            @Param("p_relationship_id") Integer relationshipId,
            @Param("p_occ") String occ,
            @Param("p_addr") String addr
    );

    Optional<Guardian> findTopByFirstNameAndLastNameAndPhoneNumberOrderByGuardianIdDesc(
            String firstName,
            String lastName,
            String phoneNumber
    );

    Optional<Guardian> findByPhoneNumber(String phoneNumber);
}
