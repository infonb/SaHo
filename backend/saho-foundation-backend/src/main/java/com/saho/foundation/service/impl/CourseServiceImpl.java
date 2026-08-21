package com.saho.foundation.service.impl;

import com.saho.foundation.dto.CourseResponseDto;
import com.saho.foundation.dto.CourseSubjectMarksDto;
import com.saho.foundation.entity.ClassMaster;
import com.saho.foundation.entity.CourseMaster;
import com.saho.foundation.entity.CourseSubject;
import com.saho.foundation.entity.SubjectMaster;
import com.saho.foundation.exception.ResourceNotFoundException;
import com.saho.foundation.repository.ClassRepository;
import com.saho.foundation.repository.CourseRepository;
import com.saho.foundation.repository.CourseSubjectRepository;
import com.saho.foundation.repository.SubjectRepository;
import com.saho.foundation.service.iservices.ICourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseServiceImpl implements ICourseService {

    private final CourseRepository courseRepository;
    private final CourseSubjectRepository courseSubjectRepository;
    private final ClassRepository classRepository;
    private final SubjectRepository subjectRepository;

    @Override
    public List<CourseResponseDto> getAllCourses() {
        return courseRepository.findByIsDeletedFalse()
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public List<CourseSubjectMarksDto> getCourseSubjectsByClass(Integer classId) {
        ClassMaster classMaster = classRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found with id " + classId));
        if (Boolean.TRUE.equals(classMaster.getIsDeleted())) {
            throw new ResourceNotFoundException("Class not found with id " + classId);
        }

        List<CourseSubject> subjects = courseSubjectRepository
                .findByCourseIdAndClassIdAndIsDeletedFalseOrderByCourseSubjectIdAsc(
                        classMaster.getCourseId(), classId);

        Map<Integer, SubjectMaster> subjectMap = subjects.isEmpty() ? Map.of()
                : subjectRepository.findBySubjectIdInAndIsDeletedFalse(
                                subjects.stream().map(CourseSubject::getSubjectId).toList())
                        .stream()
                        .collect(Collectors.toMap(SubjectMaster::getSubjectId, Function.identity()));

        return subjects.stream()
                .map(cs -> {
                    SubjectMaster subject = subjectMap.get(cs.getSubjectId());
                    return CourseSubjectMarksDto.builder()
                            .courseSubjectId(cs.getCourseSubjectId())
                            .courseId(cs.getCourseId())
                            .classId(cs.getClassId())
                            .subjectId(cs.getSubjectId())
                            .subjectName(subject != null ? subject.getSubjectName() : null)
                            .subjectCode(cs.getSubjectCode())
                            .build();
                })
                .toList();
    }

    private CourseResponseDto toDto(CourseMaster course) {
        return CourseResponseDto.builder()
                .courseId(course.getCourseId())
                .courseName(course.getCourseName())
                .boardType(course.getBoardType())
                .build();
    }
}
