package com.saho.foundation.service.impl;

import com.saho.foundation.dto.LoginRequestDto;
import com.saho.foundation.dto.LoginResponseDto;
import com.saho.foundation.entity.User;
import com.saho.foundation.repository.UserRepository;
import com.saho.foundation.security.JwtUtil;
import com.saho.foundation.service.iservices.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Override
    public LoginResponseDto adminLogin(LoginRequestDto request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailIdIgnoreCase(email)
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

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword())
            );
        } catch (BadCredentialsException e) {
            if (!user.getPassword().startsWith("$2") && user.getPassword().equals(request.getPassword())) {
                user.setPassword(passwordEncoder.encode(request.getPassword()));
                userRepository.save(user);
            } else {
                throw new IllegalArgumentException("Invalid email or password.");
            }
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

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getStudentId().toString(), request.getPassword())
            );
        } catch (BadCredentialsException e) {
            throw new IllegalArgumentException("Invalid Student ID or Password.");
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
