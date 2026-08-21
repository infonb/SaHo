package com.saho.foundation.service;

import com.saho.foundation.dto.AdminRequestDto;
import com.saho.foundation.dto.AdminResponseDto;
import com.saho.foundation.entity.User;
import com.saho.foundation.exception.DuplicateResourceException;
import com.saho.foundation.exception.ResourceNotFoundException;
import com.saho.foundation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<AdminResponseDto> getAllAdmins() {
        List<User> admins = userRepository.findByRoleAndIsDeleted("ADMIN", false);
        return admins.stream().map(this::toResponseDto).collect(Collectors.toList());
    }

    public long getAdminCount() {
        return userRepository.countByRoleAndIsDeleted("ADMIN", false);
    }

    public AdminResponseDto createAdmin(AdminRequestDto request) {
        String normalizedEmail = request.getEmailId().trim().toLowerCase();
        Optional<User> existing = userRepository.findByEmailIdIgnoreCase(normalizedEmail);
        if (existing.isPresent()) {
            throw new DuplicateResourceException("An admin with this email already exists.");
        }

        User user = User.builder()
                .emailId(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole().toUpperCase())
                .isActive(true)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(request.getCreatedBy() != null ? request.getCreatedBy() : "admin")
                .build();

        user = userRepository.save(user);
        return toResponseDto(user);
    }

    public void deactivateAdmin(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found with id: " + id));
        user.setIsActive(false);
        user.setIsDeleted(true);
        user.setModifiedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    public AdminResponseDto updateAdmin(Integer id, AdminRequestDto request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found with id: " + id));

        if (request.getEmailId() != null) {
            String normalizedEmail = request.getEmailId().trim().toLowerCase();
            Optional<User> existing = userRepository.findByEmailIdIgnoreCase(normalizedEmail);
            if (existing.isPresent() && !existing.get().getUserId().equals(id)) {
                throw new DuplicateResourceException("An admin with this email already exists.");
            }
            user.setEmailId(normalizedEmail);
        }

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getRole() != null) {
            user.setRole(request.getRole().toUpperCase());
        }

        user.setModifiedAt(LocalDateTime.now());
        user.setModifiedBy(request.getCreatedBy());
        user = userRepository.save(user);
        return toResponseDto(user);
    }

    private AdminResponseDto toResponseDto(User user) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
        return AdminResponseDto.builder()
                .userId(user.getUserId())
                .emailId(user.getEmailId())
                .role(user.getRole())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().format(formatter) : null)
                .createdBy(user.getCreatedBy())
                .build();
    }
}
