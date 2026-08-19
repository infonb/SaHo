package com.saho.foundation.service.impl.master;

import com.saho.foundation.dto.DependencyCountDto;
import com.saho.foundation.entity.MandalMaster;
import com.saho.foundation.exception.DuplicateResourceException;
import com.saho.foundation.exception.ResourceNotFoundException;
import com.saho.foundation.repository.DistrictRepository;
import com.saho.foundation.repository.MandalRepository;
import com.saho.foundation.repository.MasterDependencyCounter;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class MandalMasterHandler extends AbstractMasterHandler<MandalMaster> {

    private final MasterDependencyCounter counter;
    private final DistrictRepository districtRepository;

    public MandalMasterHandler(MandalRepository repository, MasterDependencyCounter counter, DistrictRepository districtRepository) {
        super(repository);
        this.counter = counter;
        this.districtRepository = districtRepository;
    }

    @Override
    public String type() {
        return "mandal";
    }

    @Override
    public String displayName() {
        return "Mandal";
    }

    @Override
    protected String searchColumn() {
        return "mndlName";
    }

    @Override
    protected Map<String, Object> toRecord(MandalMaster entity) {
        Map<String, Object> record = new LinkedHashMap<>();
        record.put("id", entity.getMndlId());
        record.put("name", entity.getMndlName());
        record.put("districtId", entity.getDistId());
        record.put("districtName", districtRepository.findById(entity.getDistId())
                .map(d -> d.getDistName()).orElse(""));
        return record;
    }

    @Override
    protected MandalMaster fromBody(Map<String, Object> body) {
        return MandalMaster.builder()
                .mndlName(requiredText(body, "name", "Mandal name"))
                .distId(requiredInt(body, "districtId", "District"))
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Override
    protected void applyUpdate(MandalMaster entity, Map<String, Object> body) {
        entity.setMndlName(requiredText(body, "name", "Mandal name"));
        entity.setDistId(requiredInt(body, "districtId", "District"));
        entity.setUpdatedAt(LocalDateTime.now());
    }

    @Override
    protected void validate(Map<String, Object> body, MandalMaster existing) {
        Integer districtId = requiredInt(body, "districtId", "District");
        if (!districtRepository.existsById(districtId)) {
            throw new ResourceNotFoundException("District not found with id " + districtId);
        }
        String name = requiredText(body, "name", "Mandal name");
        MandalRepository repo = (MandalRepository) repository;
        repo.findByMndlNameIgnoreCaseAndDistId(name, districtId).ifPresent(dup -> {
            if (existing == null || !dup.getMndlId().equals(existing.getMndlId())) {
                throw new DuplicateResourceException("Mandal '" + name + "' already exists in this district");
            }
        });
    }

    @Override
    protected List<DependencyCountDto> getDependencies(MandalMaster entity) {
        Integer id = entity.getMndlId();
        return List.of(
                DependencyCountDto.builder().label("Villages").count(counter.villagesByMandal(id)).build(),
                DependencyCountDto.builder().label("Schools").count(counter.schoolsByMandal(id)).build(),
                DependencyCountDto.builder().label("Students").count(counter.studentsByMandal(id)).build(),
                DependencyCountDto.builder().label("Reminders").count(counter.remindersByMandal(id)).build()
        );
    }

    @Override
    protected boolean isDeleted(MandalMaster entity) {
        return Boolean.TRUE.equals(entity.getIsDeleted());
    }

    @Override
    protected void markDeleted(MandalMaster entity) {
        entity.setIsDeleted(true);
        entity.setUpdatedAt(LocalDateTime.now());
    }
}