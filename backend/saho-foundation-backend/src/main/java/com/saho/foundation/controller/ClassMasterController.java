package com.saho.foundation.controller;

import com.saho.foundation.dto.ClassResponseDto;
import com.saho.foundation.service.iservices.MasterService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/class-master")
@RequiredArgsConstructor
public class ClassMasterController {

    private final MasterService masterService;

    @GetMapping("/by-course/{courseId}")
    public List<ClassResponseDto> getClassesByCourse(@PathVariable Integer courseId) {
        return masterService.getClassesByCourse(courseId);
    }
}