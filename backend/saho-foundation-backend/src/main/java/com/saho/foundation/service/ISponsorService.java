package com.saho.foundation.service;

import com.saho.foundation.dto.request.SponsorRequestDto;
import com.saho.foundation.dto.response.SponsorListResponseDto;
import com.saho.foundation.dto.response.SponsorResponseDto;

public interface ISponsorService {

    void createOrUpdateSponsor(SponsorRequestDto request);
    SponsorResponseDto getSponsorById(Integer sponsorId);
    SponsorListResponseDto getAllSponsors(Integer pageNumber, Integer pageSize);
    void deleteSponsorById(Integer sponsorId, Integer modifiedBy);

    void assignSponsorToStudent(Integer studentId, Integer sponsorId, String createdBy);
    void removeSponsorFromStudent(Integer studentId);

}
