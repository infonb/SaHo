package com.saho.foundation.repository;

import com.saho.foundation.entity.RelationshipMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RelationshipRepository extends JpaRepository<RelationshipMaster, Integer> {

    List<RelationshipMaster> findByIsDeletedFalse();
}