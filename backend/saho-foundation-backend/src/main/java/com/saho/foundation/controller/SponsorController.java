package com.saho.foundation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.saho.foundation.dto.request.SponsorRequestDto;
import com.saho.foundation.dto.response.ApiResponseDto;
import com.saho.foundation.dto.response.SponsorListResponseDto;
import com.saho.foundation.dto.response.SponsorResponseDto;
import com.saho.foundation.entity.StudentSponsor;
import com.saho.foundation.repository.StudentSponsorRepository;
import com.saho.foundation.security.SecurityUtil;
import com.saho.foundation.service.iservices.ISponsorService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
@RequestMapping("/api/sponsors")
@RequiredArgsConstructor
public class SponsorController {

    private static final Logger log = LoggerFactory.getLogger(SponsorController.class);
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private final ISponsorService sponsorService;
    private final StudentSponsorRepository studentSponsorRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponseDto<String>> createOrUpdateSponsor(
            @RequestBody SponsorRequestDto request
    ) {
        return saveSponsor(request);
    }

    @PostMapping(consumes = {
            MediaType.MULTIPART_FORM_DATA_VALUE,
            "multipart/form-data;charset=UTF-8"
    })
    public ResponseEntity<ApiResponseDto<String>> createOrUpdateSponsorWithImage(
            @RequestParam("request") String requestJson,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) throws IOException {
        SponsorRequestDto request = readSponsorRequest(requestJson);
        if (image != null && !image.isEmpty()) {
            request.setImageUrl(saveImage(image, "sponsors", "sponsor"));
        }
        return saveSponsor(request);
    }

    @PutMapping(value = "/{sponsorId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponseDto<String>> updateSponsor(
            @PathVariable Integer sponsorId,
            @RequestBody SponsorRequestDto request
    ) {
        request.setSponsorId(sponsorId);
        return saveSponsor(request);
    }

    @PutMapping(value = "/{sponsorId}", consumes = {
            MediaType.MULTIPART_FORM_DATA_VALUE,
            "multipart/form-data;charset=UTF-8"
    })
    public ResponseEntity<ApiResponseDto<String>> updateSponsorWithImage(
            @PathVariable Integer sponsorId,
            @RequestParam("request") String requestJson,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) throws IOException {
        SponsorRequestDto request = readSponsorRequest(requestJson);
        request.setSponsorId(sponsorId);
        if (image != null && !image.isEmpty()) {
            request.setImageUrl(saveImage(image, "sponsors", "sponsor"));
        }
        return saveSponsor(request);
    }



    @GetMapping("/{sponsorId}")
public ResponseEntity<ApiResponseDto<SponsorResponseDto>>
getSponsorById(@PathVariable Integer sponsorId) {
    String role = SecurityUtil.getCurrentRole();
    log.info("GET /api/sponsors/{} - role={}", sponsorId, role);

    SponsorResponseDto response =
            sponsorService.getSponsorById(sponsorId);

    return ResponseEntity.ok(
            new ApiResponseDto<>(
                    true,
                    "Sponsor fetched successfully",
                    response
            )
    );
}

    @GetMapping
    public ResponseEntity<ApiResponseDto<SponsorListResponseDto>> getAllSponsors(
            @RequestParam(defaultValue = "1") Integer pageNumber,
            @RequestParam(defaultValue = "100") Integer pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String nationality,
            @RequestParam(required = false) String createdMonth,
            @RequestParam(defaultValue = "sponsor_id") String sortColumn,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {

        SponsorListResponseDto response =
                sponsorService.getAllSponsors(
                        pageNumber,
                        pageSize,
                        search,
                        type,
                        nationality,
                        sortColumn,
                        sortDirection,
                        createdMonth
                );

        return ResponseEntity.ok(
                new ApiResponseDto<>(
                        true,
                        "Sponsors fetched successfully",
                        response
                )
        );
    }

    @GetMapping("/ids")
    public ResponseEntity<ApiResponseDto<List<Integer>>> getSponsorIds(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String nationality,
            @RequestParam(required = false) String isActive
    ) {
        List<Integer> ids = sponsorService.getSponsorIds(search, type, nationality, isActive);

        return ResponseEntity.ok(
                new ApiResponseDto<>(
                        true,
                        "Sponsor IDs fetched successfully",
                        ids
                )
        );
    }

    @DeleteMapping("/{sponsorId}")
    public ResponseEntity<ApiResponseDto<String>> deleteSponsorById(
            @PathVariable Integer sponsorId,
            @RequestParam Integer modifiedBy
    ) {

        sponsorService.deleteSponsorById(sponsorId, modifiedBy);

        return ResponseEntity.ok(
                new ApiResponseDto<>(
                        true,
                        "Sponsor deleted successfully",
                        null
                )
        );
    }

    @PostMapping("/assign")
    public ResponseEntity<ApiResponseDto<String>> assignSponsorToStudent(
            @RequestParam Integer studentId,
            @RequestParam Integer sponsorId,
            @RequestParam String createdBy
    ) {
        sponsorService.assignSponsorToStudent(studentId, sponsorId, createdBy);

        return ResponseEntity.ok(
                new ApiResponseDto<>(
                        true,
                        "Sponsor assigned to student successfully",
                        null
                )
        );
    }

    @DeleteMapping("/student/{studentId}/sponsor")
    public ResponseEntity<ApiResponseDto<String>> removeSponsorFromStudent(
            @PathVariable Integer studentId
    ) {
        sponsorService.removeSponsorFromStudent(studentId);

        return ResponseEntity.ok(
                new ApiResponseDto<>(
                        true,
                        "Sponsor removed from student successfully",
                        null
                )
        );
    }

    @GetMapping("/student/{studentId}/assignment")
    public ResponseEntity<ApiResponseDto<StudentSponsor>> getStudentSponsorAssignment(
            @PathVariable Integer studentId
    ) {
        String role = SecurityUtil.getCurrentRole();
        Integer tokenStudentId = SecurityUtil.getCurrentStudentId();
        log.info("GET /api/sponsors/student/{}/assignment - role={}, tokenStudentId={}", studentId, role, tokenStudentId);
        SecurityUtil.checkStudentOwnership(studentId);

        List<StudentSponsor> assignments = studentSponsorRepository.findByStudentIdAndIsActiveTrue(studentId);
        StudentSponsor assignment = assignments.isEmpty() ? null : assignments.get(0);

        return ResponseEntity.ok(
                new ApiResponseDto<>(
                        true,
                        "Assignment fetched successfully",
                        assignment
                )
        );
    }

    @GetMapping("/{sponsorId}/assignments")
    public ResponseEntity<ApiResponseDto<List<StudentSponsor>>> getSponsorAssignments(
            @PathVariable Integer sponsorId
    ) {
        List<StudentSponsor> assignments = studentSponsorRepository.findBySponsorIdAndIsActiveTrue(sponsorId);

        return ResponseEntity.ok(
                new ApiResponseDto<>(
                        true,
                        "Assignments fetched successfully",
                        assignments
                )
        );
    }

    private SponsorRequestDto readSponsorRequest(String requestJson) {
        try {
            return objectMapper.readValue(requestJson, SponsorRequestDto.class);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid sponsor request data", ex);
        }
    }

    private ResponseEntity<ApiResponseDto<String>> saveSponsor(SponsorRequestDto request) {
        sponsorService.createOrUpdateSponsor(request);

        return ResponseEntity.ok(
                new ApiResponseDto<>(
                        true,
                        "Sponsor saved successfully",
                        null
                )
        );
    }

    private String saveImage(MultipartFile file, String folder, String prefix) throws IOException {
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Only JPG, PNG, and WEBP images are allowed");
        }

        String extension = switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };

        Path uploadPath = Paths.get(uploadDir, folder).toAbsolutePath().normalize();
        Files.createDirectories(uploadPath);

        String fileName = prefix + "-" + UUID.randomUUID() + extension;
        Path targetPath = uploadPath.resolve(fileName).normalize();
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        return "/uploads/" + folder + "/" + fileName;
    }

}
