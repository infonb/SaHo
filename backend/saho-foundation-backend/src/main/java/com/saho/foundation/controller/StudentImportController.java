package com.saho.foundation.controller;

import com.saho.foundation.dto.imports.BulkImportResponse;
import com.saho.foundation.service.impl.StudentImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentImportController {

    private final StudentImportService studentImportService;

    @GetMapping("/import/template")
    public ResponseEntity<byte[]> downloadTemplate() throws IOException {
        byte[] template = studentImportService.generateTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=student_import_template.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(template);
    }

    @PostMapping("/import")
    public ResponseEntity<BulkImportResponse> importStudents(@RequestParam("file") MultipartFile file) {
        BulkImportResponse response = studentImportService.importStudents(file);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }
}
