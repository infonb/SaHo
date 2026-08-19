package com.saho.foundation.service.impl.master;

import com.saho.foundation.dto.DependencyCountDto;
import com.saho.foundation.entity.ClassMaster;
import com.saho.foundation.exception.DuplicateResourceException;
import com.saho.foundation.exception.ResourceNotFoundException;
import com.saho.foundation.repository.ClassRepository;
import com.saho.foundation.repository.CourseRepository;
import com.saho.foundation.repository.MasterDependencyCounter;
import com.saho.foundation.security.SecurityUtil;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class ClassMasterHandler extends AbstractMasterHandler<ClassMaster> {

    private final MasterDependencyCounter counter;
    private final CourseRepository courseRepository;

    public ClassMasterHandler(ClassRepository repository, MasterDependencyCounter counter, CourseRepository courseRepository) {
        super(repository);
        this.counter = counter;
        this.courseRepository = courseRepository;
    }

    @Override
    public String type() {
        return "class";
    }

    @Override
    public String displayName() {
        return "Class";
    }

    @Override
    protected String searchColumn() {
        return "className";
    }

    @Override
    protected Map<String, Object> toRecord(ClassMaster entity) {
        Map<String, Object> record = new LinkedHashMap<>();
        record.put("id", entity.getClassId());
        record.put("name", entity.getClassName());
        record.put("courseId", entity.getCourseId());
        record.put("courseName", courseRepository.findById(entity.getCourseId())
                .map(c -> c.getCourseName()).orElse(""));
        record.put("classOrder", entity.getClassOrder());
        return record;
    }

    @Override
    protected ClassMaster fromBody(Map<String, Object> body) {
        Integer order = optionalInt(body, "classOrder");
        return ClassMaster.builder()
                .className(requiredText(body, "name", "Class name"))
                .courseId(requiredInt(body, "courseId", "Course"))
                .classOrder(order == null ? 0 : order)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(SecurityUtil.getCurrentUserId())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Override
    protected void applyUpdate(ClassMaster entity, Map<String, Object> body) {
        Integer order = optionalInt(body, "classOrder");
        entity.setClassName(requiredText(body, "name", "Class name"));
        entity.setCourseId(requiredInt(body, "courseId", "Course"));
        entity.setClassOrder(order == null ? 0 : order);
        entity.setCreatedBy(SecurityUtil.getCurrentUserId());
        entity.setUpdatedAt(LocalDateTime.now());
    }

    @Override
    protected void validate(Map<String, Object> body, ClassMaster existing) {
        Integer courseId = requiredInt(body, "courseId", "Course");
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course not found with id " + courseId);
        }
        String name = requiredText(body, "name", "Class name");
        ClassRepository repo = (ClassRepository) repository;
        repo.findByClassNameIgnoreCaseAndCourseId(name, courseId).ifPresent(dup -> {
            if (existing == null || !dup.getClassId().equals(existing.getClassId())) {
                throw new DuplicateResourceException("Class '" + name + "' already exists in this course");
            }
        });
    }

    @Override
    protected List<DependencyCountDto> getDependencies(ClassMaster entity) {
        Integer id = entity.getClassId();
        return List.of(
                DependencyCountDto.builder().label("Students").count(counter.studentsByClass(id)).build(),
                DependencyCountDto.builder().label("Course Subject mappings").count(counter.courseSubjectsByClass(id)).build(),
                DependencyCountDto.builder().label("Reminders").count(counter.remindersByClass(id)).build()
        );
    }

    @Override
    protected boolean isDeleted(ClassMaster entity) {
        return Boolean.TRUE.equals(entity.getIsDeleted());
    }

    @Override
    protected void markDeleted(ClassMaster entity) {
        entity.setIsDeleted(true);
        entity.setCreatedBy(SecurityUtil.getCurrentUserId());
        entity.setUpdatedAt(LocalDateTime.now());
    }
}