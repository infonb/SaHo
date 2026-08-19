package com.saho.foundation.service.impl.master;

import com.saho.foundation.dto.DependencyCountDto;
import com.saho.foundation.entity.CasteMaster;
import com.saho.foundation.exception.DuplicateResourceException;
import com.saho.foundation.repository.CasteRepository;
import com.saho.foundation.repository.MasterDependencyCounter;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class CasteMasterHandler extends AbstractMasterHandler<CasteMaster> {

    private final MasterDependencyCounter counter;

    public CasteMasterHandler(CasteRepository repository, MasterDependencyCounter counter) {
        super(repository);
        this.counter = counter;
    }

    @Override
    public String type() {
        return "caste";
    }

    @Override
    public String displayName() {
        return "Caste";
    }

    @Override
    protected String searchColumn() {
        return "casteName";
    }

    @Override
    protected Map<String, Object> toRecord(CasteMaster entity) {
        Map<String, Object> record = new LinkedHashMap<>();
        record.put("id", entity.getCasteId());
        record.put("name", entity.getCasteName());
        return record;
    }

    @Override
    protected CasteMaster fromBody(Map<String, Object> body) {
        return CasteMaster.builder()
                .casteName(requiredText(body, "name", "Caste name"))
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Override
    protected void applyUpdate(CasteMaster entity, Map<String, Object> body) {
        entity.setCasteName(requiredText(body, "name", "Caste name"));
    }

    @Override
    protected void validate(Map<String, Object> body, CasteMaster existing) {
        String name = requiredText(body, "name", "Caste name");
        CasteRepository repo = (CasteRepository) repository;
        repo.findByCasteNameIgnoreCase(name).ifPresent(dup -> {
            if (existing == null || !dup.getCasteId().equals(existing.getCasteId())) {
                throw new DuplicateResourceException("Caste '" + name + "' already exists");
            }
        });
    }

    @Override
    protected List<DependencyCountDto> getDependencies(CasteMaster entity) {
        return List.of(
                DependencyCountDto.builder()
                        .label("Students")
                        .count(counter.studentsByCaste(entity.getCasteId()))
                        .build()
        );
    }

    @Override
    protected boolean isDeleted(CasteMaster entity) {
        return Boolean.TRUE.equals(entity.getIsDeleted());
    }

    @Override
    protected void markDeleted(CasteMaster entity) {
        entity.setIsDeleted(true);
    }
}