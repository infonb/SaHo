package com.saho.foundation.repository;

import com.saho.foundation.entity.SchoolMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SchoolRepository extends JpaRepository<SchoolMaster, Integer> {

    List<SchoolMaster> findByVilId(Integer vilId);
}
