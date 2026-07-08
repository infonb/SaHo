package com.saho.foundation.repository;

import com.saho.foundation.entity.VillageMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VillageRepository extends JpaRepository<VillageMaster, Integer> {

    List<VillageMaster> findByMndlId(Integer mndlId);

    Optional<VillageMaster> findByVilNameIgnoreCase(String vilName);
}
