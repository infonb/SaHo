package com.saho.foundation.service.impl.master;

import com.saho.foundation.dto.DependencyCountDto;
import com.saho.foundation.entity.DistrictMaster;
import com.saho.foundation.exception.DuplicateResourceException;
import com.saho.foundation.exception.ResourceNotFoundException;
import com.saho.foundation.repository.DistrictRepository;
import com.saho.foundation.repository.MasterDependencyCounter;
import com.saho.foundation.repository.StateRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class DistrictMasterHandler extends AbstractMasterHandler<DistrictMaster> {

    private final MasterDependencyCounter counter;
    private final StateRepository stateRepository;

    public DistrictMasterHandler(DistrictRepository repository, MasterDependencyCounter counter, StateRepository stateRepository) {
        super(repository);
        this.counter = counter;
        this.stateRepository = stateRepository;
    }

    @Override
    public String type() {
        return "district";
    }

    @Override
    public String displayName() {
        return "District";
    }

    @Override
    protected String searchColumn() {
        return "distName";
    }

    @Override
    protected Map<String, Object> toRecord(DistrictMaster entity) {
        Map<String, Object> record = new LinkedHashMap<>();
        record.put("id", entity.getDistId());
        record.put("name", entity.getDistName());
        record.put("stateId", entity.getStId());
        record.put("stateName", stateRepository.findById(entity.getStId())
                .map(s -> s.getStName()).orElse(""));
        return record;
    }

    @Override
    protected DistrictMaster fromBody(Map<String, Object> body) {
        return DistrictMaster.builder()
                .distName(requiredText(body, "name", "District name"))
                .stId(requiredInt(body, "stateId", "State"))
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Override
    protected void applyUpdate(DistrictMaster entity, Map<String, Object> body) {
        entity.setDistName(requiredText(body, "name", "District name"));
        entity.setStId(requiredInt(body, "stateId", "State"));
        entity.setUpdatedAt(LocalDateTime.now());
    }

    @Override
    protected void validate(Map<String, Object> body, DistrictMaster existing) {
        Integer stateId = requiredInt(body, "stateId", "State");
        if (!stateRepository.existsById(stateId)) {
            throw new ResourceNotFoundException("State not found with id " + stateId);
        }
        String name = requiredText(body, "name", "District name");
        DistrictRepository repo = (DistrictRepository) repository;
        repo.findByDistNameIgnoreCaseAndStId(name, stateId).ifPresent(dup -> {
            if (existing == null || !dup.getDistId().equals(existing.getDistId())) {
                throw new DuplicateResourceException("District '" + name + "' already exists in this state");
            }
        });
    }

    @Override
    protected List<DependencyCountDto> getDependencies(DistrictMaster entity) {
        Integer id = entity.getDistId();
        return List.of(
                DependencyCountDto.builder().label("Mandals").count(counter.mandalsByDistrict(id)).build(),
                DependencyCountDto.builder().label("Villages").count(counter.villagesByDistrict(id)).build(),
                DependencyCountDto.builder().label("Schools").count(counter.schoolsByDistrict(id)).build(),
                DependencyCountDto.builder().label("Students").count(counter.studentsByDistrict(id)).build(),
                DependencyCountDto.builder().label("Reminders").count(counter.remindersByDistrict(id)).build()
        );
    }

    @Override
    protected boolean isDeleted(DistrictMaster entity) {
        return Boolean.TRUE.equals(entity.getIsDeleted());
    }

    @Override
    protected void markDeleted(DistrictMaster entity) {
        entity.setIsDeleted(true);
        entity.setUpdatedAt(LocalDateTime.now());
    }
}