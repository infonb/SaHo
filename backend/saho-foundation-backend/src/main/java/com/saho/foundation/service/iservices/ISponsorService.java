package com.saho.foundation.service.iservices;

import com.saho.foundation.dto.request.SponsorRequestDto;
import com.saho.foundation.dto.response.SponsorListResponseDto;
import com.saho.foundation.dto.response.SponsorResponseDto;

import java.util.List;

public interface ISponsorService {

    void createOrUpdateSponsor(SponsorRequestDto request);
    SponsorResponseDto getSponsorById(Integer sponsorId);
    SponsorListResponseDto getAllSponsors(
            Integer pageNumber,
            Integer pageSize,
            String search,
            String sponsorType,
            String nationality,
            String sortColumn,
            String sortDirection
    );
    List<Integer> getSponsorIds(
            String search,
            String sponsorType,
            String nationality,
            String isActive
    );
    void deleteSponsorById(Integer sponsorId, Integer modifiedBy);

    void assignSponsorToStudent(Integer studentId, Integer sponsorId, String createdBy);
    void removeSponsorFromStudent(Integer studentId);

}
