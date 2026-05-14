package com.saho.foundation.controller;

import com.saho.foundation.dto.StudentDto;
import com.saho.foundation.entity.Student;
import com.saho.foundation.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    @Autowired
    private StudentService studentService;

    @PostMapping
    public Student createStudent(@RequestBody StudentDto dto) {
        return studentService.createStudent(dto);
    }
}