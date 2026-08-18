package com.saho.foundation.controller;

import com.saho.foundation.dto.CourseResponseDto;
import com.saho.foundation.service.iservices.ICourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/course-master")
@RequiredArgsConstructor
public class CourseMasterController {

    private final ICourseService courseService;

    @GetMapping
    public List<CourseResponseDto> getAllCourses() {
        return courseService.getAllCourses();
    }
}
