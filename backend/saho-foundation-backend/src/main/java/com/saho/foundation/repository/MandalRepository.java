package com.saho.foundation.repository;

import com.saho.foundation.entity.MandalMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MandalRepository extends JpaRepository<MandalMaster, Integer> {

    List<MandalMaster> findByDistId(Integer distId);
}
