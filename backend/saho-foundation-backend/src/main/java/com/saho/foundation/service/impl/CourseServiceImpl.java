package com.saho.foundation.service.impl;

import com.saho.foundation.dto.CourseResponseDto;
import com.saho.foundation.entity.CourseMaster;
import com.saho.foundation.repository.CourseRepository;
import com.saho.foundation.service.iservices.ICourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseServiceImpl implements ICourseService {

    private final CourseRepository courseRepository;

    @Override
    public List<CourseResponseDto> getAllCourses() {
        return courseRepository.findByIsDeletedFalse()
                .stream()
                .map(this::toDto)
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
