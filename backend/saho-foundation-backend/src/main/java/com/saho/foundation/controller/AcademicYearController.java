package com.saho.foundation.controller;

import com.saho.foundation.dto.AcademicYearDto;
import com.saho.foundation.service.iservices.IAcademicYearService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/master/academic-years")
@RequiredArgsConstructor
public class AcademicYearController {

    private final IAcademicYearService academicYearService;

    @GetMapping
    public List<AcademicYearDto> getAllAcademicYears() {
        return academicYearService.getAllAcademicYears();
    }

    @GetMapping("/current")
    public AcademicYearDto getCurrentAcademicYear() {
        return academicYearService.getCurrentAcademicYear();
    }
}
