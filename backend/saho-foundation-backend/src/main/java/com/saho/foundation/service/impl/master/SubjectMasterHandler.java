package com.saho.foundation.service.impl.master;

import com.saho.foundation.dto.DependencyCountDto;
import com.saho.foundation.entity.SubjectMaster;
import com.saho.foundation.exception.DuplicateResourceException;
import com.saho.foundation.repository.MasterDependencyCounter;
import com.saho.foundation.repository.SubjectRepository;
import com.saho.foundation.security.SecurityUtil;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class SubjectMasterHandler extends AbstractMasterHandler<SubjectMaster> {

    private final MasterDependencyCounter counter;

    public SubjectMasterHandler(SubjectRepository repository, MasterDependencyCounter counter) {
        super(repository);
        this.counter = counter;
    }

    @Override
    public String type() {
        return "subject";
    }

    @Override
    public String displayName() {
        return "Subject";
    }

    @Override
    protected String searchColumn() {
        return "subjectName";
    }

    @Override
    protected Map<String, Object> toRecord(SubjectMaster entity) {
        Map<String, Object> record = new LinkedHashMap<>();
        record.put("id", entity.getSubjectId());
        record.put("name", entity.getSubjectName());
        return record;
    }

    @Override
    protected SubjectMaster fromBody(Map<String, Object> body) {
        return SubjectMaster.builder()
                .subjectName(requiredText(body, "name", "Subject name"))
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(SecurityUtil.getCurrentUserId())
                .updatedAt(LocalDateTime.now())
                .updatedBy(SecurityUtil.getCurrentUserId())
                .build();
    }

    @Override
    protected void applyUpdate(SubjectMaster entity, Map<String, Object> body) {
        entity.setSubjectName(requiredText(body, "name", "Subject name"));
        entity.setUpdatedAt(LocalDateTime.now());
        entity.setUpdatedBy(SecurityUtil.getCurrentUserId());
    }

    @Override
    protected void validate(Map<String, Object> body, SubjectMaster existing) {
        String name = requiredText(body, "name", "Subject name");
        SubjectRepository repo = (SubjectRepository) repository;
        repo.findBySubjectNameIgnoreCase(name).ifPresent(dup -> {
            if (existing == null || !dup.getSubjectId().equals(existing.getSubjectId())) {
                throw new DuplicateResourceException("Subject '" + name + "' already exists");
            }
        });
    }

    @Override
    protected List<DependencyCountDto> getDependencies(SubjectMaster entity) {
        return List.of(
                DependencyCountDto.builder()
                        .label("Course Subject mappings")
                        .count(counter.courseSubjectsBySubject(entity.getSubjectId()))
                        .build()
        );
    }

    @Override
    protected boolean isDeleted(SubjectMaster entity) {
        return Boolean.TRUE.equals(entity.getIsDeleted());
    }

    @Override
    protected void markDeleted(SubjectMaster entity) {
        entity.setIsDeleted(true);
        entity.setUpdatedAt(LocalDateTime.now());
        entity.setUpdatedBy(SecurityUtil.getCurrentUserId());
    }
}