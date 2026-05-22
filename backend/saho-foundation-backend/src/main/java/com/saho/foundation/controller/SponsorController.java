package com.saho.foundation.controller;

import com.saho.foundation.dto.request.SponsorRequestDto;
import com.saho.foundation.dto.response.ApiResponseDto;
import com.saho.foundation.dto.response.SponsorListResponseDto;
import com.saho.foundation.dto.response.SponsorResponseDto;
import com.saho.foundation.service.ISponsorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity; 
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/sponsors")
@RequiredArgsConstructor
public class SponsorController {

    private final ISponsorService sponsorService;

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
            @RequestParam Integer pageNumber,
            @RequestParam Integer pageSize
    ) {

        SponsorListResponseDto response =
                sponsorService.getAllSponsors(pageNumber, pageSize);

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

}
