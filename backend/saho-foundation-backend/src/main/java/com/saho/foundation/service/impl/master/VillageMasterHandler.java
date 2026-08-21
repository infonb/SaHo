package com.saho.foundation.service.impl.master;

import com.saho.foundation.dto.DependencyCountDto;
import com.saho.foundation.entity.VillageMaster;
import com.saho.foundation.exception.DuplicateResourceException;
import com.saho.foundation.exception.ResourceNotFoundException;
import com.saho.foundation.repository.MandalRepository;
import com.saho.foundation.repository.MasterDependencyCounter;
import com.saho.foundation.repository.VillageRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class VillageMasterHandler extends AbstractMasterHandler<VillageMaster> {

    private final MasterDependencyCounter counter;
    private final MandalRepository mandalRepository;

    public VillageMasterHandler(VillageRepository repository, MasterDependencyCounter counter, MandalRepository mandalRepository) {
        super(repository);
        this.counter = counter;
        this.mandalRepository = mandalRepository;
    }

    @Override
    public String type() {
        return "village";
    }

    @Override
    public String displayName() {
        return "Village";
    }

    @Override
    protected String searchColumn() {
        return "vilName";
    }

    @Override
    protected Map<String, Object> toRecord(VillageMaster entity) {
        Map<String, Object> record = new LinkedHashMap<>();
        record.put("id", entity.getVilId());
        record.put("name", entity.getVilName());
        record.put("pincode", entity.getVilPincode());
        record.put("mandalId", entity.getMndlId());
        record.put("mandalName", mandalRepository.findById(entity.getMndlId())
                .map(m -> m.getMndlName()).orElse(""));
        return record;
    }

    @Override
    protected VillageMaster fromBody(Map<String, Object> body) {
        return VillageMaster.builder()
                .vilName(requiredText(body, "name", "Village name"))
                .vilPincode(requiredInt(body, "pincode", "Pincode"))
                .mndlId(requiredInt(body, "mandalId", "Mandal"))
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Override
    protected void applyUpdate(VillageMaster entity, Map<String, Object> body) {
        entity.setVilName(requiredText(body, "name", "Village name"));
        entity.setVilPincode(requiredInt(body, "pincode", "Pincode"));
        entity.setMndlId(requiredInt(body, "mandalId", "Mandal"));
        entity.setUpdatedAt(LocalDateTime.now());
    }

    @Override
    protected void validate(Map<String, Object> body, VillageMaster existing) {
        Integer mandalId = requiredInt(body, "mandalId", "Mandal");
        if (!mandalRepository.existsById(mandalId)) {
            throw new ResourceNotFoundException("Mandal not found with id " + mandalId);
        }
        String name = requiredText(body, "name", "Village name");
        VillageRepository repo = (VillageRepository) repository;
        repo.findByVilNameIgnoreCase(name).ifPresent(dup -> {
            if (existing == null || !dup.getVilId().equals(existing.getVilId())) {
                throw new DuplicateResourceException("Village '" + name + "' already exists");
            }
        });
    }

    @Override
    protected List<DependencyCountDto> getDependencies(VillageMaster entity) {
        Integer id = entity.getVilId();
        return List.of(
                DependencyCountDto.builder().label("Schools").count(counter.schoolsByVillage(id)).build(),
                DependencyCountDto.builder().label("Students").count(counter.studentsByVillage(id)).build(),
                DependencyCountDto.builder().label("Reminders").count(counter.remindersByVillage(id)).build()
        );
    }

    @Override
    protected boolean isDeleted(VillageMaster entity) {
        return Boolean.TRUE.equals(entity.getIsDeleted());
    }

    @Override
    protected void markDeleted(VillageMaster entity) {
        entity.setIsDeleted(true);
        entity.setUpdatedAt(LocalDateTime.now());
    }
}