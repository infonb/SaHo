package com.saho.foundation.repository;

import com.saho.foundation.entity.CasteMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CasteRepository extends JpaRepository<CasteMaster, Integer> {

    List<CasteMaster> findByIsDeletedFalse();

    Optional<CasteMaster> findByCasteNameIgnoreCase(String casteName);
}