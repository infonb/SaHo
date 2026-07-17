package com.saho.foundation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import com.saho.foundation.dto.StudentRequestDto;
import com.saho.foundation.dto.StudentPaginationResponseDto;
import com.saho.foundation.dto.StudentProfileResponseDto;
import com.saho.foundation.dto.StudentResponseDto;
import com.saho.foundation.dto.StudentSiblingInfoDto;
import com.saho.foundation.dto.StudentSiblingSearchResponseDto;
import com.saho.foundation.service.iservices.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    private final StudentService studentService;
    private final ObjectMapper objectMapper;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public StudentResponseDto createStudent(@RequestBody StudentRequestDto dto) {
        return studentService.createStudent(dto);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public StudentResponseDto createStudentWithImage(
            @RequestParam("request") String requestJson,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) throws IOException {
        StudentRequestDto dto = readStudentRequest(requestJson);
        if (image != null && !image.isEmpty()) {
            dto.setImageUrl(saveStudentImage(image));
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

    @GetMapping("/ids")
    public java.util.List<Integer> getAllStudentIds(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String classId,
            @RequestParam(required = false) String orphanStatus,
            @RequestParam(required = false) String stId,
            @RequestParam(required = false) String distId,
            @RequestParam(required = false) String mndlId,
            @RequestParam(required = false) String vilId,
            @RequestParam(required = false) String schId
    ) {
        return studentService.getAllStudentIds(search, gender, classId, orphanStatus, stId, distId, mndlId, vilId, schId);
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

    @GetMapping("/{studentId}/siblings")
    public List<StudentSiblingInfoDto> getStudentSiblings(@PathVariable Integer studentId) {
        return studentService.getSiblingsByStudentId(studentId);
    }

    @PutMapping(value = "/{studentId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public StudentResponseDto updateStudent(
            @PathVariable Integer studentId,
            @RequestBody StudentRequestDto dto
    ) {
        return studentService.updateStudent(studentId, dto);
    }

    @PutMapping(value = "/{studentId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public StudentResponseDto updateStudentWithImage(
            @PathVariable Integer studentId,
            @RequestParam("request") String requestJson,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) throws IOException {
        StudentRequestDto dto = readStudentRequest(requestJson);
        if (image != null && !image.isEmpty()) {
            dto.setImageUrl(saveStudentImage(image));
        }
        return studentService.updateStudent(studentId, dto);
    }

    @DeleteMapping("/{studentId}")
    public String deleteStudent(@PathVariable Integer studentId) {
        studentService.deleteStudent(studentId);
        return "Student soft deleted successfully";
    }

    private StudentRequestDto readStudentRequest(String requestJson) {
        try {
            return objectMapper.readValue(requestJson, StudentRequestDto.class);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid student request data", ex);
        }
    }

    private String saveStudentImage(MultipartFile file) throws IOException {
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Only JPG, PNG, and WEBP student photos are allowed");
        }

        String extension = switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };

        Path studentUploadDir = Paths.get(uploadDir, "students").toAbsolutePath().normalize();
        Files.createDirectories(studentUploadDir);

        String fileName = "student-" + UUID.randomUUID() + extension;
        Path targetPath = studentUploadDir.resolve(fileName).normalize();
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        return "/uploads/students/" + fileName;
    }
}
