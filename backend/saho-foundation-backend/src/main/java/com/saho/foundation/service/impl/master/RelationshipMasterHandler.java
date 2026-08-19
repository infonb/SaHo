package com.saho.foundation.service.impl.master;

import com.saho.foundation.dto.DependencyCountDto;
import com.saho.foundation.entity.RelationshipMaster;
import com.saho.foundation.exception.DuplicateResourceException;
import com.saho.foundation.repository.MasterDependencyCounter;
import com.saho.foundation.repository.RelationshipRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class RelationshipMasterHandler extends AbstractMasterHandler<RelationshipMaster> {

    private final MasterDependencyCounter counter;

    public RelationshipMasterHandler(RelationshipRepository repository, MasterDependencyCounter counter) {
        super(repository);
        this.counter = counter;
    }

    @Override
    public String type() {
        return "relationship";
    }

    @Override
    public String displayName() {
        return "Relationship";
    }

    @Override
    protected String searchColumn() {
        return "relationshipName";
    }

    @Override
    protected Map<String, Object> toRecord(RelationshipMaster entity) {
        Map<String, Object> record = new LinkedHashMap<>();
        record.put("id", entity.getRelationshipId());
        record.put("name", entity.getRelationshipName());
        record.put("description", entity.getDescription());
        return record;
    }

    @Override
    protected RelationshipMaster fromBody(Map<String, Object> body) {
        return RelationshipMaster.builder()
                .relationshipName(requiredText(body, "name", "Relationship name"))
                .description(text(body, "description"))
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Override
    protected void applyUpdate(RelationshipMaster entity, Map<String, Object> body) {
        entity.setRelationshipName(requiredText(body, "name", "Relationship name"));
        entity.setDescription(text(body, "description"));
        entity.setUpdatedAt(LocalDateTime.now());
    }

    @Override
    protected void validate(Map<String, Object> body, RelationshipMaster existing) {
        String name = requiredText(body, "name", "Relationship name");
        RelationshipRepository repo = (RelationshipRepository) repository;
        repo.findByRelationshipNameIgnoreCase(name).ifPresent(dup -> {
            if (existing == null || !dup.getRelationshipId().equals(existing.getRelationshipId())) {
                throw new DuplicateResourceException("Relationship '" + name + "' already exists");
            }
        });
    }

    @Override
    protected List<DependencyCountDto> getDependencies(RelationshipMaster entity) {
        return List.of(
                DependencyCountDto.builder()
                        .label("Guardians")
                        .count(counter.guardiansByRelationship(entity.getRelationshipId()))
                        .build()
        );
    }

    @Override
    protected boolean isDeleted(RelationshipMaster entity) {
        return Boolean.TRUE.equals(entity.getIsDeleted());
    }

    @Override
    protected void markDeleted(RelationshipMaster entity) {
        entity.setIsDeleted(true);
        entity.setUpdatedAt(LocalDateTime.now());
    }
}