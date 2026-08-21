package com.saho.foundation.controller;

import com.saho.foundation.dto.CourseSubjectMarksDto;
import com.saho.foundation.service.iservices.ICourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/course-subjects")
@RequiredArgsConstructor
public class CourseSubjectController {

    private final ICourseService courseService;

    @GetMapping("/by-class/{classId}")
    public List<CourseSubjectMarksDto> getSubjectsByClass(@PathVariable Integer classId) {
        return courseService.getCourseSubjectsByClass(classId);
    }
}