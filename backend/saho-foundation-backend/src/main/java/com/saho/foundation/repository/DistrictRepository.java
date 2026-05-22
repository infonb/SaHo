package com.saho.foundation.repository;

import com.saho.foundation.entity.DistrictMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DistrictRepository extends JpaRepository<DistrictMaster, Integer> {

    List<DistrictMaster> findByStId(Integer stId);
}
