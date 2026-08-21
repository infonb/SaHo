package com.saho.foundation.service.iservices;

import com.saho.foundation.dto.AcademicYearDto;

import java.util.List;

public interface IAcademicYearService {

    List<AcademicYearDto> getAllAcademicYears();

    AcademicYearDto getCurrentAcademicYear();
}
