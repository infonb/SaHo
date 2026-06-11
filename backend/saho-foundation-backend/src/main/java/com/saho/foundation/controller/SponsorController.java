package com.saho.foundation.controller;

import com.saho.foundation.dto.request.SponsorRequestDto;
import com.saho.foundation.dto.response.ApiResponseDto;
import com.saho.foundation.dto.response.SponsorListResponseDto;
import com.saho.foundation.dto.response.SponsorResponseDto;
import com.saho.foundation.entity.StudentSponsor;
import com.saho.foundation.repository.StudentSponsorRepository;
import com.saho.foundation.service.ISponsorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/api/sponsors")
@RequiredArgsConstructor
public class SponsorController {

    private final ISponsorService sponsorService;
    private final StudentSponsorRepository studentSponsorRepository;

    @PostMapping
    public ResponseEntity<ApiResponseDto<String>> createOrUpdateSponsor(
            @RequestBody SponsorRequestDto request
    ) {

        sponsorService.createOrUpdateSponsor(request);

        return ResponseEntity.ok(
                new ApiResponseDto<>(
                        true,
                        "Sponsor saved successfully",
                        null
                )
        );
    }



    @GetMapping("/{sponsorId}")
public ResponseEntity<ApiResponseDto<SponsorResponseDto>>
getSponsorById(@PathVariable Integer sponsorId) {

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
                        sortDirection
                );

        return ResponseEntity.ok(
                new ApiResponseDto<>(
                        true,
                        "Sponsors fetched successfully",
                        response
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

}
