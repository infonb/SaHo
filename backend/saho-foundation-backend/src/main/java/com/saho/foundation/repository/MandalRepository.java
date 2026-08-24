package com.saho.foundation.repository;

import com.saho.foundation.entity.MandalMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MandalRepository extends JpaRepository<MandalMaster, Integer>, JpaSpecificationExecutor<MandalMaster> {

    List<MandalMaster> findByDistId(Integer distId);

    Optional<MandalMaster> findByMndlNameIgnoreCaseAndDistId(String mndlName, Integer distId);

    long countByIsDeletedFalse();
}
