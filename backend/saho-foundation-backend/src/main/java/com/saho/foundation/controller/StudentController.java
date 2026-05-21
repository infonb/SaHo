package com.saho.foundation.controller;

import com.saho.foundation.dto.StudentRequestDto;
import com.saho.foundation.dto.StudentPaginationResponseDto;
import com.saho.foundation.dto.StudentProfileResponseDto;
import com.saho.foundation.dto.StudentResponseDto;
import com.saho.foundation.dto.StudentSiblingSearchResponseDto;
import com.saho.foundation.service.iservices.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @PostMapping
    public StudentResponseDto createStudent(@RequestBody StudentRequestDto requestDto) {
        return studentService.createStudent(requestDto);
    }

    @GetMapping
    public StudentPaginationResponseDto getAllStudents(
            @RequestParam(defaultValue = "1") Integer pageNumber,
            @RequestParam(defaultValue = "10") Integer pageSize
    ) {
        return studentService.getAllStudents(pageNumber, pageSize);
    }

    @GetMapping("/{studentId}")
    public StudentProfileResponseDto getStudentById(@PathVariable Integer studentId) {
        return studentService.getStudentById(studentId);
    }

    @GetMapping("/aadhaar/{aadhaarNumber}")
    public StudentSiblingSearchResponseDto getStudentByAadhaarNumber(@PathVariable String aadhaarNumber) {
        return studentService.getStudentByAadhaarNumber(aadhaarNumber);
    }

    @PutMapping("/{studentId}")
    public StudentResponseDto updateStudent(@PathVariable Integer studentId, @RequestBody StudentRequestDto requestDto) {
        return studentService.updateStudent(studentId, requestDto);
    }

    @DeleteMapping("/{studentId}")
    public String deleteStudent(@PathVariable Integer studentId) {
        studentService.deleteStudent(studentId);
        return "Student soft deleted successfully";
    }
}
