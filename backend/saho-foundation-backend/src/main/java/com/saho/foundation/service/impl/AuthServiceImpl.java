package com.saho.foundation.service.impl;

import com.saho.foundation.dto.LoginRequestDto;
import com.saho.foundation.dto.LoginResponseDto;
import com.saho.foundation.entity.Student;
import com.saho.foundation.entity.User;
import com.saho.foundation.repository.StudentRepository;
import com.saho.foundation.repository.UserRepository;
import com.saho.foundation.security.JwtUtil;
import com.saho.foundation.service.iservices.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Override
    public LoginResponseDto adminLogin(LoginRequestDto request) {
        User user = userRepository.findByEmailId(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));

        if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new IllegalArgumentException("Access denied. Admin privileges required.");
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new IllegalArgumentException("Account is inactive. Contact administrator.");
        }

        if (Boolean.TRUE.equals(user.getIsDeleted())) {
            throw new IllegalArgumentException("Account not found.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            if (user.getPassword().startsWith("$2")) {
                throw new IllegalArgumentException("Invalid email or password.");
            }
            if (!user.getPassword().equals(request.getPassword())) {
                throw new IllegalArgumentException("Invalid email or password.");
            }
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            userRepository.save(user);
        }

        String token = jwtUtil.generateToken(user.getUserId(), user.getRole().toUpperCase(), null);

        return new LoginResponseDto(
                user.getUserId(),
                null,
                user.getEmailId(),
                user.getRole().toUpperCase(),
                true,
                token
        );
    }

    @Override
    public LoginResponseDto studentLogin(LoginRequestDto request) {
        if (request.getStudentId() == null) {
            throw new IllegalArgumentException("Student ID is required.");
        }

        User user = userRepository.findByStudentId(request.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid Student ID or Password."));

        if (!"STUDENT".equalsIgnoreCase(user.getRole())) {
            throw new IllegalArgumentException("Invalid Student ID or Password.");
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new IllegalArgumentException("Account is inactive. Contact administrator.");
        }

        if (Boolean.TRUE.equals(user.getIsDeleted())) {
            throw new IllegalArgumentException("Account does not exist.");
        }

        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("Student record not found."));

        String expectedDobPassword = student.getDob().format(DateTimeFormatter.ofPattern("ddMMyyyy"));

        boolean isDobPassword = expectedDobPassword.equals(request.getPassword());
        boolean matchesStoredHash = passwordEncoder.matches(request.getPassword(), user.getPassword());

        if (!isDobPassword && !matchesStoredHash) {
            throw new IllegalArgumentException("Invalid Student ID or Password. Password is your date of birth in DDMMYYYY format (e.g., 10102017 for 10-Oct-2017).");
        }

        if (isDobPassword && !matchesStoredHash) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            userRepository.save(user);
        }

        String token = jwtUtil.generateToken(user.getUserId(), user.getRole().toUpperCase(), user.getStudentId());

        return new LoginResponseDto(
                user.getUserId(),
                user.getStudentId(),
                null,
                user.getRole().toUpperCase(),
                true,
                token
        );
    }
}
