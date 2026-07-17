package com.saho.foundation.controller;

import com.saho.foundation.service.iservices.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentExportController {

    private final StudentService studentService;

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportStudents(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String classId,
            @RequestParam(required = false) String orphanStatus,
            @RequestParam(required = false) String stId,
            @RequestParam(required = false) String distId,
            @RequestParam(required = false) String mndlId,
            @RequestParam(required = false) String vilId,
            @RequestParam(required = false) String schId,
            @RequestParam(defaultValue = "student_id") String sortColumn,
            @RequestParam(defaultValue = "DESC") String sortDirection,
            @RequestParam(required = false) String studentIds
    ) {
        byte[] excel = studentService.exportStudentsExcel(search, gender, classId, orphanStatus, stId, distId, mndlId, vilId, schId, sortColumn, sortDirection, studentIds);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=students.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excel);
    }
}
