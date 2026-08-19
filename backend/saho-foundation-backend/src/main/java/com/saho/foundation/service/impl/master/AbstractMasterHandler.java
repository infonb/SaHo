package com.saho.foundation.service.impl.master;

import com.saho.foundation.dto.DependencyCheckResponseDto;
import com.saho.foundation.dto.DependencyCountDto;
import com.saho.foundation.dto.MasterPageResponseDto;
import com.saho.foundation.exception.ResourceNotFoundException;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public abstract class AbstractMasterHandler<T> implements MasterCrudHandler {

    protected final JpaRepository<T, Integer> repository;
    protected final JpaSpecificationExecutor<T> specificationExecutor;

    protected AbstractMasterHandler(JpaRepository<T, Integer> repository) {
        this.repository = repository;
        this.specificationExecutor = (JpaSpecificationExecutor<T>) repository;
    }

    protected abstract String searchColumn();

    protected abstract Map<String, Object> toRecord(T entity);

    protected abstract T fromBody(Map<String, Object> body);

    protected abstract void applyUpdate(T entity, Map<String, Object> body);

    protected abstract void validate(Map<String, Object> body, T existing);

    protected abstract List<DependencyCountDto> getDependencies(T entity);

    protected abstract boolean isDeleted(T entity);

    protected abstract void markDeleted(T entity);

    protected Specification<T> buildSearchSpec(String search) {
        return (root, query, cb) -> cb.like(cb.lower(root.get(searchColumn())),
                "%" + search.trim().toLowerCase() + "%");
    }

    @Override
    public MasterPageResponseDto list(String search, int page, int size) {
        int safePage = Math.max(page, 1) - 1;
        int safeSize = Math.min(Math.max(size, 1), 500);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.ASC, searchColumn()));

        Specification<T> spec = (root, query, cb) -> cb.isFalse(root.get("isDeleted"));
        if (search != null && !search.isBlank()) {
            Specification<T> searchSpec = buildSearchSpec(search);
            spec = spec.and(searchSpec);
        }

        Page<T> result = specificationExecutor.findAll(spec, pageable);
        List<Map<String, Object>> items = result.getContent().stream()
                .map(this::toRecord)
                .collect(Collectors.toList());
        return MasterPageResponseDto.builder()
                .page(page)
                .size(result.getSize())
                .total(result.getTotalElements())
                .items(items)
                .build();
    }

    @Override
    public Map<String, Object> get(Integer id) {
        return toRecord(require(id));
    }

    protected T require(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(displayName() + " not found with id " + id));
    }

    @Override
    public Map<String, Object> create(Map<String, Object> body) {
        validate(body, null);
        return toRecord(repository.saveAndFlush(fromBody(body)));
    }

    @Override
    public Map<String, Object> update(Integer id, Map<String, Object> body) {
        T entity = require(id);
        if (isDeleted(entity)) {
            throw new IllegalArgumentException(displayName() + " is already deleted");
        }
        validate(body, entity);
        applyUpdate(entity, body);
        return toRecord(repository.saveAndFlush(entity));
    }

    @Override
    public void delete(Integer id) {
        T entity = require(id);
        if (isDeleted(entity)) {
            throw new IllegalArgumentException(displayName() + " is already deleted");
        }
        String blocked = getDependencies(entity).stream()
                .filter(d -> d.getCount() > 0)
                .map(d -> d.getLabel() + " (" + d.getCount() + ")")
                .collect(Collectors.joining(", "));
        if (!blocked.isEmpty()) {
            throw new IllegalArgumentException("Cannot delete " + displayName() + ": depends on " + blocked);
        }
        markDeleted(entity);
        repository.saveAndFlush(entity);
    }

    @Override
    public DependencyCheckResponseDto checkDependencies(Integer id) {
        T entity = require(id);
        List<DependencyCountDto> deps = getDependencies(entity);
        boolean canDelete = deps.stream().noneMatch(d -> d.getCount() > 0) && !isDeleted(entity);
        return DependencyCheckResponseDto.builder()
                .canDelete(canDelete)
                .dependencies(deps)
                .build();
    }

    protected static String text(Map<String, Object> body, String key) {
        Object value = body.get(key);
        return value == null ? null : String.valueOf(value).trim();
    }

    protected static String requiredText(Map<String, Object> body, String key, String fieldLabel) {
        String value = text(body, key);
        if (value == null || value.isEmpty()) {
            throw new IllegalArgumentException(fieldLabel + " is required");
        }
        return value;
    }

    protected static Integer optionalInt(Map<String, Object> body, String key) {
        Object value = body.get(key);
        if (value == null || String.valueOf(value).isBlank()) {
            return null;
        }
        try {
            return Integer.valueOf(String.valueOf(value).trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid value for " + key + ": " + value);
        }
    }

    protected static Integer requiredInt(Map<String, Object> body, String key, String fieldLabel) {
        Integer value = optionalInt(body, key);
        if (value == null) {
            throw new IllegalArgumentException(fieldLabel + " is required");
        }
        return value;
    }

    protected static Boolean optionalBool(Map<String, Object> body, String key) {
        Object value = body.get(key);
        if (value == null || String.valueOf(value).isBlank()) {
            return null;
        }
        String raw = String.valueOf(value).trim();
        if ("true".equalsIgnoreCase(raw) || "1".equalsIgnoreCase(raw) || "yes".equalsIgnoreCase(raw)) {
            return Boolean.TRUE;
        }
        if ("false".equalsIgnoreCase(raw) || "0".equalsIgnoreCase(raw) || "no".equalsIgnoreCase(raw)) {
            return Boolean.FALSE;
        }
        throw new IllegalArgumentException("Invalid boolean for " + key + ": " + value);
    }

    protected static java.time.LocalDate optionalLocalDate(Map<String, Object> body, String key) {
        String value = text(body, key);
        if (value == null || value.isEmpty()) {
            return null;
        }
        try {
            return java.time.LocalDate.parse(value);
        } catch (java.time.format.DateTimeParseException e) {
            throw new IllegalArgumentException("Invalid date for " + key + ": " + value);
        }
    }

    protected static java.time.LocalDate requiredLocalDate(Map<String, Object> body, String key, String fieldLabel) {
        java.time.LocalDate value = optionalLocalDate(body, key);
        if (value == null) {
            throw new IllegalArgumentException(fieldLabel + " is required");
        }
        return value;
    }

    protected static Predicate like(Root<?> root, jakarta.persistence.criteria.CriteriaBuilder cb, String column, String search) {
        return cb.like(cb.lower(root.get(column)), "%" + search.trim().toLowerCase() + "%");
    }
}