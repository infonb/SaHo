package com.saho.foundation.controller;

import com.saho.foundation.dto.ClassMarksRequestDto;
import com.saho.foundation.dto.ClassMarksSheetResponseDto;
import com.saho.foundation.dto.ClassStudentResponseDto;
import com.saho.foundation.dto.StudentMarksRequestDto;
import com.saho.foundation.dto.StudentMarksResponseDto;
import com.saho.foundation.service.iservices.StudentMarksService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/marks")
@RequiredArgsConstructor
public class StudentMarksController {

    private final StudentMarksService studentMarksService;

    @GetMapping("/{studentAcademicId}")
    public StudentMarksResponseDto getMarks(@PathVariable Integer studentAcademicId) {
        return studentMarksService.getMarksByStudentAcademicId(studentAcademicId);
    }

    @PostMapping("/annual")
    public StudentMarksResponseDto saveAnnualMarks(@RequestBody StudentMarksRequestDto request) {
        return studentMarksService.saveAnnualMarks(request);
    }

    @GetMapping("/class/students")
    public List<ClassStudentResponseDto> getClassStudents(
            @RequestParam Integer academicYearId,
            @RequestParam Integer schoolId,
            @RequestParam Integer classId
    ) {
        return studentMarksService.getClassStudents(academicYearId, schoolId, classId);
    }

    @GetMapping("/class/sheet")
    public ClassMarksSheetResponseDto getClassMarksSheet(
            @RequestParam Integer academicYearId,
            @RequestParam Integer schoolId,
            @RequestParam Integer classId
    ) {
        return studentMarksService.getClassMarksSheet(academicYearId, schoolId, classId);
    }

    @PostMapping("/class/annual")
    public ClassMarksSheetResponseDto saveClassAnnualMarks(@RequestBody ClassMarksRequestDto request) {
        return studentMarksService.saveClassAnnualMarks(request);
    }
}