package com.saho.foundation.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class SponsorListResponseDto {

    private Integer pageNumber;

    private Integer pageSize;

    private Integer itemCount;

    private List<SponsorResponseDto> sponsors;
}
