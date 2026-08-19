package com.saho.foundation.service.impl.master;

import com.saho.foundation.dto.DependencyCountDto;
import com.saho.foundation.entity.DistrictMaster;
import com.saho.foundation.entity.MandalMaster;
import com.saho.foundation.entity.SchoolMaster;
import com.saho.foundation.entity.VillageMaster;
import com.saho.foundation.exception.DuplicateResourceException;
import com.saho.foundation.exception.ResourceNotFoundException;
import com.saho.foundation.repository.DistrictRepository;
import com.saho.foundation.repository.MandalRepository;
import com.saho.foundation.repository.MasterDependencyCounter;
import com.saho.foundation.repository.SchoolRepository;
import com.saho.foundation.repository.VillageRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class SchoolMasterHandler extends AbstractMasterHandler<SchoolMaster> {

    private final MasterDependencyCounter counter;
    private final VillageRepository villageRepository;
    private final MandalRepository mandalRepository;
    private final DistrictRepository districtRepository;

    public SchoolMasterHandler(SchoolRepository repository, MasterDependencyCounter counter,
                               VillageRepository villageRepository, MandalRepository mandalRepository,
                               DistrictRepository districtRepository) {
        super(repository);
        this.counter = counter;
        this.villageRepository = villageRepository;
        this.mandalRepository = mandalRepository;
        this.districtRepository = districtRepository;
    }

    @Override
    public String type() {
        return "school";
    }

    @Override
    public String displayName() {
        return "School";
    }

    @Override
    protected String searchColumn() {
        return "schName";
    }

    @Override
    protected Map<String, Object> toRecord(SchoolMaster entity) {
        VillageMaster village = entity.getVilId() == null ? null
                : villageRepository.findById(entity.getVilId()).orElse(null);
        MandalMaster mandal = village == null ? null
                : mandalRepository.findById(village.getMndlId()).orElse(null);
        DistrictMaster district = mandal == null ? null
                : districtRepository.findById(mandal.getDistId()).orElse(null);

        Map<String, Object> record = new LinkedHashMap<>();
        record.put("id", entity.getSchId());
        record.put("name", entity.getSchName());
        record.put("address", entity.getSchAddress());
        record.put("villageId", entity.getVilId());
        record.put("villageName", village == null ? "" : village.getVilName());
        record.put("mandalName", mandal == null ? "" : mandal.getMndlName());
        record.put("districtName", district == null ? "" : district.getDistName());
        return record;
    }

    @Override
    protected SchoolMaster fromBody(Map<String, Object> body) {
        return SchoolMaster.builder()
                .schName(requiredText(body, "name", "School name"))
                .schAddress(requiredText(body, "address", "School address"))
                .vilId(requiredInt(body, "villageId", "Village"))
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Override
    protected void applyUpdate(SchoolMaster entity, Map<String, Object> body) {
        entity.setSchName(requiredText(body, "name", "School name"));
        entity.setSchAddress(requiredText(body, "address", "School address"));
        entity.setVilId(requiredInt(body, "villageId", "Village"));
        entity.setUpdatedAt(LocalDateTime.now());
    }

    @Override
    protected void validate(Map<String, Object> body, SchoolMaster existing) {
        Integer villageId = requiredInt(body, "villageId", "Village");
        if (!villageRepository.existsById(villageId)) {
            throw new ResourceNotFoundException("Village not found with id " + villageId);
        }
        String name = requiredText(body, "name", "School name");
        SchoolRepository repo = (SchoolRepository) repository;
        repo.findBySchNameIgnoreCase(name).ifPresent(dup -> {
            if (existing == null || !dup.getSchId().equals(existing.getSchId())) {
                throw new DuplicateResourceException("School '" + name + "' already exists");
            }
        });
    }

    @Override
    protected List<DependencyCountDto> getDependencies(SchoolMaster entity) {
        Integer id = entity.getSchId();
        return List.of(
                DependencyCountDto.builder().label("Students").count(counter.studentsBySchool(id)).build(),
                DependencyCountDto.builder().label("Reminders").count(counter.remindersBySchool(id)).build()
        );
    }

    @Override
    protected boolean isDeleted(SchoolMaster entity) {
        return Boolean.TRUE.equals(entity.getIsDeleted());
    }

    @Override
    protected void markDeleted(SchoolMaster entity) {
        entity.setIsDeleted(true);
        entity.setUpdatedAt(LocalDateTime.now());
    }
}