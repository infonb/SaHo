package com.saho.foundation.service.iservices;

import com.saho.foundation.dto.CasteResponseDto;
import com.saho.foundation.dto.ClassResponseDto;
import com.saho.foundation.dto.LabelValueResponseDto;
import com.saho.foundation.dto.RelationshipResponseDto;

import java.util.List;

public interface MasterService {

    List<CasteResponseDto> getAllCastes();

    List<RelationshipResponseDto> getAllRelationships();

    List<ClassResponseDto> getAllClasses();

    List<ClassResponseDto> getClassesByCourse(Integer courseId);

    List<LabelValueResponseDto> getParentStatuses();

    List<LabelValueResponseDto> getParentOccupations();
    List<LabelValueResponseDto> getAdmissionTypes();
    List<LabelValueResponseDto> getAcademicStatuses();
}
