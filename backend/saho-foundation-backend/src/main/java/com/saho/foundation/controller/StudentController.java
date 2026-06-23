package com.saho.foundation.controller;

import com.saho.foundation.dto.StudentPaginationResponseDto;
import com.saho.foundation.service.iservices.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.saho.foundation.dto.StudentRequestDto;
import com.saho.foundation.dto.StudentPaginationResponseDto;
import com.saho.foundation.dto.StudentProfileResponseDto;
import com.saho.foundation.dto.StudentResponseDto;
import com.saho.foundation.dto.StudentSiblingSearchResponseDto;
import com.saho.foundation.service.iservices.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @PostMapping(consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.MULTIPART_FORM_DATA_VALUE})
    public StudentResponseDto createStudent(
            @RequestPart(value = "request", required = false) StudentRequestDto requestDto,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @RequestBody(required = false) StudentRequestDto requestDtoJson
    ) throws IOException {
        StudentRequestDto dto = requestDto != null ? requestDto : requestDtoJson;
        if (dto == null) {
            throw new IllegalArgumentException("Student request data is required");
        }
        if (image != null && !image.isEmpty()) {
            dto.setImageUrl(encodeImageToBase64(image));
        }
        return studentService.createStudent(dto);
    }

    @GetMapping
    public StudentPaginationResponseDto getAllStudents(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "1") Integer pageNumber,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String classId,
            @RequestParam(required = false) String orphanStatus,
            @RequestParam(required = false) String stId,
            @RequestParam(required = false) String distId,
            @RequestParam(required = false) String mndlId,
            @RequestParam(required = false) String vilId,
            @RequestParam(required = false) String schId,
            @RequestParam(defaultValue = "student_id") String sortColumn,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        return studentService.getAllStudents(search, pageNumber, pageSize, gender, classId, orphanStatus, stId, distId, mndlId, vilId, schId, sortColumn, sortDirection);
    }

    @GetMapping("/me")
    public StudentProfileResponseDto getMyProfile(@RequestParam Integer userId) {
        return studentService.getStudentProfileByUserId(userId);
    }

    @GetMapping("/{studentId}")
    public StudentProfileResponseDto getStudentById(@PathVariable Integer studentId) {
        return studentService.getStudentById(studentId);
    }

    @GetMapping("/aadhaar/{aadhaarNumber}")
    public StudentSiblingSearchResponseDto getStudentByAadhaarNumber(@PathVariable String aadhaarNumber) {
        return studentService.getStudentByAadhaarNumber(aadhaarNumber);
    }

    @PutMapping(value = "/{studentId}", consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.MULTIPART_FORM_DATA_VALUE})
    public StudentResponseDto updateStudent(
            @PathVariable Integer studentId,
            @RequestPart(value = "request", required = false) StudentRequestDto requestDto,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @RequestBody(required = false) StudentRequestDto requestDtoJson
    ) throws IOException {
        StudentRequestDto dto = requestDto != null ? requestDto : requestDtoJson;
        if (dto == null) {
            throw new IllegalArgumentException("Student request data is required");
        }
        if (image != null && !image.isEmpty()) {
            dto.setImageUrl(encodeImageToBase64(image));
        }
        return studentService.updateStudent(studentId, dto);
    }

    @DeleteMapping("/{studentId}")
    public String deleteStudent(@PathVariable Integer studentId) {
        studentService.deleteStudent(studentId);
        return "Student soft deleted successfully";
    }

    private String encodeImageToBase64(MultipartFile file) throws IOException {
        String contentType = file.getContentType() != null ? file.getContentType() : "image/jpeg";
        return "data:" + contentType + ";base64," + Base64.getEncoder().encodeToString(file.getBytes());
    }
}
