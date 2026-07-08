package com.saho.foundation.repository;

import com.saho.foundation.entity.DistrictMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DistrictRepository extends JpaRepository<DistrictMaster, Integer> {

    List<DistrictMaster> findByStId(Integer stId);

    Optional<DistrictMaster> findByDistNameIgnoreCaseAndStId(String distName, Integer stId);
}
