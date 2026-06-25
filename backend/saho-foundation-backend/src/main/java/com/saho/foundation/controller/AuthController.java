package com.saho.foundation.controller;

import com.saho.foundation.dto.LoginRequestDto;
import com.saho.foundation.dto.LoginResponseDto;
import com.saho.foundation.service.iservices.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@RequestBody LoginRequestDto request) {
        LoginResponseDto response = authService.adminLogin(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/student-login")
    public ResponseEntity<LoginResponseDto> studentLogin(@RequestBody LoginRequestDto request) {
        LoginResponseDto response = authService.studentLogin(request);
        return ResponseEntity.ok(response);
    }
}
