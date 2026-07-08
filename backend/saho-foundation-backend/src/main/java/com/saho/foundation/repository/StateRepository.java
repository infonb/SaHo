package com.saho.foundation.repository;

import com.saho.foundation.entity.StateMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StateRepository extends JpaRepository<StateMaster, Integer> {

    List<StateMaster> findByIsDeletedFalse();

    Optional<StateMaster> findByStNameIgnoreCase(String stName);
}
