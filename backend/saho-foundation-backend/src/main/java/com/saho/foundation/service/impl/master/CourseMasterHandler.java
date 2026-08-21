package com.saho.foundation.service.impl.master;

import com.saho.foundation.dto.DependencyCountDto;
import com.saho.foundation.entity.CourseMaster;
import com.saho.foundation.exception.DuplicateResourceException;
import com.saho.foundation.repository.CourseRepository;
import com.saho.foundation.repository.MasterDependencyCounter;
import com.saho.foundation.security.SecurityUtil;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class CourseMasterHandler extends AbstractMasterHandler<CourseMaster> {

    private final MasterDependencyCounter counter;

    public CourseMasterHandler(CourseRepository repository, MasterDependencyCounter counter) {
        super(repository);
        this.counter = counter;
    }

    @Override
    public String type() {
        return "course";
    }

    @Override
    public String displayName() {
        return "Course";
    }

    @Override
    protected String searchColumn() {
        return "courseName";
    }

    @Override
    protected Map<String, Object> toRecord(CourseMaster entity) {
        Map<String, Object> record = new LinkedHashMap<>();
        record.put("id", entity.getCourseId());
        record.put("name", entity.getCourseName());
        record.put("boardType", entity.getBoardType());
        return record;
    }

    @Override
    protected CourseMaster fromBody(Map<String, Object> body) {
        return CourseMaster.builder()
                .courseName(requiredText(body, "name", "Course name"))
                .boardType(requiredText(body, "boardType", "Board type"))
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(SecurityUtil.getCurrentUserId())
                .updatedAt(LocalDateTime.now())
                .updatedBy(SecurityUtil.getCurrentUserId())
                .build();
    }

    @Override
    protected void applyUpdate(CourseMaster entity, Map<String, Object> body) {
        entity.setCourseName(requiredText(body, "name", "Course name"));
        entity.setBoardType(requiredText(body, "boardType", "Board type"));
        entity.setUpdatedAt(LocalDateTime.now());
        entity.setUpdatedBy(SecurityUtil.getCurrentUserId());
    }

    @Override
    protected void validate(Map<String, Object> body, CourseMaster existing) {
        String name = requiredText(body, "name", "Course name");
        CourseRepository repo = (CourseRepository) repository;
        repo.findByCourseNameIgnoreCase(name).ifPresent(dup -> {
            if (existing == null || !dup.getCourseId().equals(existing.getCourseId())) {
                throw new DuplicateResourceException("Course '" + name + "' already exists");
            }
        });
    }

    @Override
    protected List<DependencyCountDto> getDependencies(CourseMaster entity) {
        Integer id = entity.getCourseId();
        return List.of(
                DependencyCountDto.builder().label("Classes").count(counter.classesByCourse(id)).build(),
                DependencyCountDto.builder().label("Course Subject mappings").count(counter.courseSubjectsByCourse(id)).build(),
                DependencyCountDto.builder().label("Students").count(counter.studentsByCourse(id)).build()
        );
    }

    @Override
    protected boolean isDeleted(CourseMaster entity) {
        return Boolean.TRUE.equals(entity.getIsDeleted());
    }

    @Override
    protected void markDeleted(CourseMaster entity) {
        entity.setIsDeleted(true);
        entity.setUpdatedAt(LocalDateTime.now());
        entity.setUpdatedBy(SecurityUtil.getCurrentUserId());
    }
}