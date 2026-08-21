package com.saho.foundation.service.impl.master;

import com.saho.foundation.dto.DependencyCountDto;
import com.saho.foundation.entity.ClassMaster;
import com.saho.foundation.entity.CourseMaster;
import com.saho.foundation.entity.CourseSubject;
import com.saho.foundation.entity.SubjectMaster;
import com.saho.foundation.exception.DuplicateResourceException;
import com.saho.foundation.exception.ResourceNotFoundException;
import com.saho.foundation.repository.ClassRepository;
import com.saho.foundation.repository.CourseRepository;
import com.saho.foundation.repository.CourseSubjectRepository;
import com.saho.foundation.repository.SubjectRepository;
import com.saho.foundation.security.SecurityUtil;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Component
public class CourseSubjectHandler extends AbstractMasterHandler<CourseSubject> {

    private final CourseRepository courseRepository;
    private final ClassRepository classRepository;
    private final SubjectRepository subjectRepository;

    public CourseSubjectHandler(CourseSubjectRepository repository, CourseRepository courseRepository,
                                ClassRepository classRepository, SubjectRepository subjectRepository) {
        super(repository);
        this.courseRepository = courseRepository;
        this.classRepository = classRepository;
        this.subjectRepository = subjectRepository;
    }

    @Override
    public String type() {
        return "courseSubject";
    }

    @Override
    public String displayName() {
        return "Course Subject mapping";
    }

    @Override
    protected String searchColumn() {
        return "subjectCode";
    }

    @Override
    protected Map<String, Object> toRecord(CourseSubject entity) {
        Map<String, Object> record = new LinkedHashMap<>();
        record.put("id", entity.getCourseSubjectId());
        record.put("courseId", entity.getCourseId());
        record.put("courseName", courseRepository.findById(entity.getCourseId())
                .map(CourseMaster::getCourseName).orElse(""));
        record.put("classId", entity.getClassId());
        record.put("className", classRepository.findById(entity.getClassId())
                .map(ClassMaster::getClassName).orElse(""));
        record.put("subjectId", entity.getSubjectId());
        record.put("subjectName", subjectRepository.findById(entity.getSubjectId())
                .map(SubjectMaster::getSubjectName).orElse(""));
        record.put("subjectCode", entity.getSubjectCode());
        return record;
    }

    @Override
    protected CourseSubject fromBody(Map<String, Object> body) {
        return CourseSubject.builder()
                .courseId(requiredInt(body, "courseId", "Course"))
                .classId(requiredInt(body, "classId", "Class"))
                .subjectId(requiredInt(body, "subjectId", "Subject"))
                .subjectCode(text(body, "subjectCode"))
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(SecurityUtil.getCurrentUserId())
                .updatedAt(LocalDateTime.now())
                .updatedBy(SecurityUtil.getCurrentUserId())
                .build();
    }

    @Override
    protected void applyUpdate(CourseSubject entity, Map<String, Object> body) {
        entity.setCourseId(requiredInt(body, "courseId", "Course"));
        entity.setClassId(requiredInt(body, "classId", "Class"));
        entity.setSubjectId(requiredInt(body, "subjectId", "Subject"));
        entity.setSubjectCode(text(body, "subjectCode"));
        entity.setUpdatedAt(LocalDateTime.now());
        entity.setUpdatedBy(SecurityUtil.getCurrentUserId());
    }

    @Override
    protected void validate(Map<String, Object> body, CourseSubject existing) {
        Integer courseId = requiredInt(body, "courseId", "Course");
        Integer classId = requiredInt(body, "classId", "Class");
        Integer subjectId = requiredInt(body, "subjectId", "Subject");

        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course not found with id " + courseId);
        }
        if (!subjectRepository.existsById(subjectId)) {
            throw new ResourceNotFoundException("Subject not found with id " + subjectId);
        }
        ClassMaster classMaster = classRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found with id " + classId));
        if (!Objects.equals(classMaster.getCourseId(), courseId)) {
            throw new IllegalArgumentException("Class '" + classMaster.getClassName()
                    + "' does not belong to the selected course");
        }

        CourseSubjectRepository repo = (CourseSubjectRepository) repository;
        repo.findByCourseIdAndClassIdAndSubjectIdAndIsDeletedFalse(courseId, classId, subjectId).ifPresent(dup -> {
            if (existing == null || !dup.getCourseSubjectId().equals(existing.getCourseSubjectId())) {
                throw new DuplicateResourceException("This subject is already mapped to the selected class");
            }
        });
    }

    @Override
    protected Specification<CourseSubject> buildSearchSpec(String search) {
        String pattern = "%" + search.trim().toLowerCase() + "%";
        return (root, query, cb) -> {
            Subquery<Integer> courseSub = query.subquery(Integer.class);
            Root<CourseMaster> courseRoot = courseSub.from(CourseMaster.class);
            courseSub.select(courseRoot.get("courseId"));
            courseSub.where(cb.like(cb.lower(courseRoot.get("courseName")), pattern));

            Subquery<Integer> classSub = query.subquery(Integer.class);
            Root<ClassMaster> classRoot = classSub.from(ClassMaster.class);
            classSub.select(classRoot.get("classId"));
            classSub.where(cb.like(cb.lower(classRoot.get("className")), pattern));

            Subquery<Integer> subjectSub = query.subquery(Integer.class);
            Root<SubjectMaster> subjectRoot = subjectSub.from(SubjectMaster.class);
            subjectSub.select(subjectRoot.get("subjectId"));
            subjectSub.where(cb.like(cb.lower(subjectRoot.get("subjectName")), pattern));

            return cb.or(
                    cb.like(cb.lower(root.get("subjectCode")), pattern),
                    root.get("courseId").in(courseSub),
                    root.get("classId").in(classSub),
                    root.get("subjectId").in(subjectSub)
            );
        };
    }

    @Override
    protected List<DependencyCountDto> getDependencies(CourseSubject entity) {
        return List.of();
    }

    @Override
    protected boolean isDeleted(CourseSubject entity) {
        return Boolean.TRUE.equals(entity.getIsDeleted());
    }

    @Override
    protected void markDeleted(CourseSubject entity) {
        entity.setIsDeleted(true);
        entity.setUpdatedAt(LocalDateTime.now());
        entity.setUpdatedBy(SecurityUtil.getCurrentUserId());
    }
}