package com.saho.foundation.repository;

import com.saho.foundation.entity.SubjectMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubjectRepository extends JpaRepository<SubjectMaster, Integer>, JpaSpecificationExecutor<SubjectMaster> {

    Optional<SubjectMaster> findBySubjectNameIgnoreCase(String subjectName);

    boolean existsBySubjectNameIgnoreCase(String subjectName);

    boolean existsBySubjectNameIgnoreCaseAndSubjectIdNot(String subjectName, Integer subjectId);

    List<SubjectMaster> findByIsDeletedFalse();

    List<SubjectMaster> findBySubjectIdInAndIsDeletedFalse(Collection<Integer> subjectIds);

    @Query("select distinct s.subjectId from SubjectMaster s where s.subjectId in :ids")
    List<Integer> findExistingIds(@Param("ids") Collection<Integer> ids);
}