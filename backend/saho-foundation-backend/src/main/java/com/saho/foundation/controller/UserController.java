package com.saho.foundation.controller;

import com.saho.foundation.dto.AdminRequestDto;
import com.saho.foundation.dto.AdminResponseDto;
import com.saho.foundation.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admins")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<AdminResponseDto>> getAllAdmins() {
        return ResponseEntity.ok(userService.getAllAdmins());
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getAdminCount() {
        long count = userService.getAdminCount();
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PostMapping
    public ResponseEntity<AdminResponseDto> createAdmin(@RequestBody AdminRequestDto request) {
        AdminResponseDto response = userService.createAdmin(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdminResponseDto> updateAdmin(@PathVariable Integer id, @RequestBody AdminRequestDto request) {
        AdminResponseDto response = userService.updateAdmin(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivateAdmin(@PathVariable Integer id) {
        userService.deactivateAdmin(id);
        return ResponseEntity.noContent().build();
    }
}
