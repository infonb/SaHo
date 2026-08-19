package com.saho.foundation.service.impl.master;

import com.saho.foundation.dto.DependencyCountDto;
import com.saho.foundation.entity.StateMaster;
import com.saho.foundation.exception.DuplicateResourceException;
import com.saho.foundation.repository.MasterDependencyCounter;
import com.saho.foundation.repository.StateRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class StateMasterHandler extends AbstractMasterHandler<StateMaster> {

    private final MasterDependencyCounter counter;

    public StateMasterHandler(StateRepository repository, MasterDependencyCounter counter) {
        super(repository);
        this.counter = counter;
    }

    @Override
    public String type() {
        return "state";
    }

    @Override
    public String displayName() {
        return "State";
    }

    @Override
    protected String searchColumn() {
        return "stName";
    }

    @Override
    protected Map<String, Object> toRecord(StateMaster entity) {
        Map<String, Object> record = new LinkedHashMap<>();
        record.put("id", entity.getStId());
        record.put("name", entity.getStName());
        return record;
    }

    @Override
    protected StateMaster fromBody(Map<String, Object> body) {
        return StateMaster.builder()
                .stName(requiredText(body, "name", "State name"))
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Override
    protected void applyUpdate(StateMaster entity, Map<String, Object> body) {
        entity.setStName(requiredText(body, "name", "State name"));
        entity.setUpdatedAt(LocalDateTime.now());
    }

    @Override
    protected void validate(Map<String, Object> body, StateMaster existing) {
        String name = requiredText(body, "name", "State name");
        StateRepository repo = (StateRepository) repository;
        repo.findByStNameIgnoreCase(name).ifPresent(dup -> {
            if (existing == null || !dup.getStId().equals(existing.getStId())) {
                throw new DuplicateResourceException("State '" + name + "' already exists");
            }
        });
    }

    @Override
    protected List<DependencyCountDto> getDependencies(StateMaster entity) {
        Integer id = entity.getStId();
        return List.of(
                DependencyCountDto.builder().label("Districts").count(counter.districtsByState(id)).build(),
                DependencyCountDto.builder().label("Students").count(counter.studentsByState(id)).build(),
                DependencyCountDto.builder().label("Reminders").count(counter.remindersByState(id)).build()
        );
    }

    @Override
    protected boolean isDeleted(StateMaster entity) {
        return Boolean.TRUE.equals(entity.getIsDeleted());
    }

    @Override
    protected void markDeleted(StateMaster entity) {
        entity.setIsDeleted(true);
        entity.setUpdatedAt(LocalDateTime.now());
    }
}