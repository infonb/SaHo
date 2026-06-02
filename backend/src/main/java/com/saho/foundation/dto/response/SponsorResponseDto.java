package com.saho.foundation.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class SponsorResponseDto {

    private Integer sponsorId;

    private String sponsorName;

    private String nationality;

    private String sponsorType;

    private String email;

    private LocalDate dob;

    private String phNo;

    private String loc;

    private String contrib;
}