package com.saho.foundation.controller;

import com.saho.foundation.dto.GuardianDto;
import com.saho.foundation.entity.Guardian;
import com.saho.foundation.repository.GuardianRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/guardians")
@RequiredArgsConstructor
public class GuardianController {

    private final GuardianRepository guardianRepository;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GuardianDto createGuardian(@RequestBody GuardianDto dto) {
        guardianRepository.createOrUpdateGuardian(
                null,
                dto.getFirstName(),
                dto.getLastName(),
                dto.getPhoneNumber(),
                dto.getRelationshipId(),
                dto.getOcc(),
                dto.getAddr()
        );
        Guardian guardian = guardianRepository.findTopByFirstNameAndLastNameAndPhoneNumberOrderByGuardianIdDesc(
                dto.getFirstName(),
                dto.getLastName(),
                dto.getPhoneNumber()
        ).orElseThrow(() -> new IllegalStateException("Guardian not found after create"));
        return toDto(guardian);
    }

    @PutMapping("/{guardianId}")
    public GuardianDto updateGuardian(@PathVariable Integer guardianId, @RequestBody GuardianDto dto) {
        guardianRepository.createOrUpdateGuardian(
                guardianId,
                dto.getFirstName(),
                dto.getLastName(),
                dto.getPhoneNumber(),
                dto.getRelationshipId(),
                dto.getOcc(),
                dto.getAddr()
        );
        return guardianRepository.findById(guardianId)
                .map(this::toDto)
                .orElseGet(() -> guardianRepository.findTopByFirstNameAndLastNameAndPhoneNumberOrderByGuardianIdDesc(
                        dto.getFirstName(),
                        dto.getLastName(),
                        dto.getPhoneNumber()
                ).map(this::toDto).orElseThrow(() -> new IllegalStateException("Guardian not found after update")));
    }

    @GetMapping("/{guardianId}")
    public GuardianDto getGuardian(@PathVariable Integer guardianId) {
        return guardianRepository.findById(guardianId)
                .map(this::toDto)
                .orElseThrow(() -> new IllegalStateException("Guardian not found with id: " + guardianId));
    }

    private GuardianDto toDto(Guardian guardian) {
        return GuardianDto.builder()
                .guardianId(guardian.getGuardianId())
                .firstName(guardian.getFirstName())
                .lastName(guardian.getLastName())
                .phoneNumber(guardian.getPhoneNumber())
                .relationshipId(guardian.getRelationshipId())
                .occ(guardian.getOcc())
                .addr(guardian.getAddr())
                .isDeleted(guardian.getIsDeleted())
                .createdAt(guardian.getCreatedAt())
                .updatedAt(guardian.getUpdatedAt())
                .build();
    }
}
