package com.saho.foundation.service.impl.master;

import com.saho.foundation.dto.DependencyCountDto;
import com.saho.foundation.entity.AcademicYear;
import com.saho.foundation.exception.DuplicateResourceException;
import com.saho.foundation.repository.AcademicYearRepository;
import com.saho.foundation.repository.MasterDependencyCounter;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class AcademicYearHandler extends AbstractMasterHandler<AcademicYear> {

    private final MasterDependencyCounter counter;

    public AcademicYearHandler(AcademicYearRepository repository, MasterDependencyCounter counter) {
        super(repository);
        this.counter = counter;
    }

    @Override
    public String type() {
        return "academicYear";
    }

    @Override
    public String displayName() {
        return "Academic Year";
    }

    @Override
    protected String searchColumn() {
        return "academicYearName";
    }

    @Override
    protected Map<String, Object> toRecord(AcademicYear entity) {
        Map<String, Object> record = new LinkedHashMap<>();
        record.put("id", entity.getAcademicYearId());
        record.put("name", entity.getAcademicYearName());
        record.put("startDate", entity.getStartDate());
        record.put("endDate", entity.getEndDate());
        record.put("isCurrent", entity.getIsCurrent());
        record.put("isActive", entity.getIsActive());
        return record;
    }

    @Override
    protected AcademicYear fromBody(Map<String, Object> body) {
        return AcademicYear.builder()
                .academicYearName(requiredText(body, "name", "Academic year name"))
                .startDate(requiredLocalDate(body, "startDate", "Start date"))
                .endDate(requiredLocalDate(body, "endDate", "End date"))
                .isCurrent(optionalBool(body, "isCurrent") == null ? Boolean.FALSE : optionalBool(body, "isCurrent"))
                .isActive(optionalBool(body, "isActive") == null ? Boolean.TRUE : optionalBool(body, "isActive"))
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Override
    protected void applyUpdate(AcademicYear entity, Map<String, Object> body) {
        entity.setAcademicYearName(requiredText(body, "name", "Academic year name"));
        entity.setStartDate(requiredLocalDate(body, "startDate", "Start date"));
        entity.setEndDate(requiredLocalDate(body, "endDate", "End date"));
        entity.setIsCurrent(optionalBool(body, "isCurrent") == null ? Boolean.FALSE : optionalBool(body, "isCurrent"));
        entity.setIsActive(optionalBool(body, "isActive") == null ? Boolean.TRUE : optionalBool(body, "isActive"));
        entity.setUpdatedAt(LocalDateTime.now());
    }

    @Override
    protected void validate(Map<String, Object> body, AcademicYear existing) {
        String name = requiredText(body, "name", "Academic year name");
        LocalDate startDate = requiredLocalDate(body, "startDate", "Start date");
        LocalDate endDate = requiredLocalDate(body, "endDate", "End date");
        if (!endDate.isAfter(startDate)) {
            throw new IllegalArgumentException("End date must be after start date");
        }
        AcademicYearRepository repo = (AcademicYearRepository) repository;
        repo.findByAcademicYearNameIgnoreCase(name).ifPresent(dup -> {
            if (existing == null || !dup.getAcademicYearId().equals(existing.getAcademicYearId())) {
                throw new DuplicateResourceException("Academic year '" + name + "' already exists");
            }
        });
    }

    @Override
    protected List<DependencyCountDto> getDependencies(AcademicYear entity) {
        return List.of(
                DependencyCountDto.builder()
                        .label("Students")
                        .count(counter.studentsByAcademicYear(entity.getAcademicYearId()))
                        .build()
        );
    }

    @Override
    protected boolean isDeleted(AcademicYear entity) {
        return Boolean.TRUE.equals(entity.getIsDeleted());
    }

    @Override
    protected void markDeleted(AcademicYear entity) {
        entity.setIsDeleted(true);
        entity.setUpdatedAt(LocalDateTime.now());
    }
}