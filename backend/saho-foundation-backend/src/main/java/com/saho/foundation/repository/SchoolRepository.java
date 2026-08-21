package com.saho.foundation.repository;

import com.saho.foundation.entity.SchoolMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SchoolRepository extends JpaRepository<SchoolMaster, Integer>, JpaSpecificationExecutor<SchoolMaster> {

    List<SchoolMaster> findByVilId(Integer vilId);

    List<SchoolMaster> findByIsDeletedFalse();

    List<SchoolMaster> findByIsDeletedFalseAndSchNameContainingIgnoreCase(String schName);

    Optional<SchoolMaster> findBySchNameIgnoreCase(String schName);
}
