package com.saho.foundation.service.impl;

import com.saho.foundation.dto.CasteResponseDto;
import com.saho.foundation.dto.ClassResponseDto;
import com.saho.foundation.dto.LabelValueResponseDto;
import com.saho.foundation.dto.RelationshipResponseDto;
import com.saho.foundation.entity.CasteMaster;
import com.saho.foundation.entity.ClassMaster;
import com.saho.foundation.entity.RelationshipMaster;
import com.saho.foundation.enums.AdmissionType;
import com.saho.foundation.enums.ParentOccupation;
import com.saho.foundation.enums.ParentStatus;
import com.saho.foundation.enums.StudentAcademicStatus;
import com.saho.foundation.repository.CasteRepository;
import com.saho.foundation.repository.ClassRepository;
import com.saho.foundation.repository.RelationshipRepository;
import com.saho.foundation.service.iservices.MasterService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MasterServiceImpl implements MasterService {

    private final CasteRepository casteRepository;
    private final RelationshipRepository relationshipRepository;
    private final ClassRepository classRepository;

    @Override
    public List<CasteResponseDto> getAllCastes() {
        return casteRepository.findByIsDeletedFalse()
                .stream()
                .map(caste -> CasteResponseDto.builder()
                        .casteId(caste.getCasteId())
                        .casteName(caste.getCasteName())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<RelationshipResponseDto> getAllRelationships() {
        return relationshipRepository.findByIsDeletedFalse()
                .stream()
                .map(rel -> RelationshipResponseDto.builder()
                        .relationshipId(rel.getRelationshipId())
                        .relationshipName(rel.getRelationshipName())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<ClassResponseDto> getAllClasses() {
        return classRepository.findByIsDeletedFalseOrderByClassOrderAsc()
                .stream()
                .map(cls -> ClassResponseDto.builder()
                        .classId(cls.getClassId())
                        .className(cls.getClassName())
                        .classOrder(cls.getClassOrder())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<ClassResponseDto> getClassesByCourse(Integer courseId) {
        return classRepository.findByCourseIdAndIsDeletedFalseOrderByClassOrderAsc(courseId)
                .stream()
                .map(cls -> ClassResponseDto.builder()
                        .classId(cls.getClassId())
                        .className(cls.getClassName())
                        .classOrder(cls.getClassOrder())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<LabelValueResponseDto> getAdmissionTypes() {
        return java.util.Arrays.stream(AdmissionType.values())
                .map(type -> LabelValueResponseDto.builder()
                        .value(type.getValue())
                        .label(type.getLabel())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<LabelValueResponseDto> getAcademicStatuses() {
        return java.util.Arrays.stream(StudentAcademicStatus.values())
                .map(status -> LabelValueResponseDto.builder()
                        .value(status.getValue())
                        .label(status.getLabel())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<LabelValueResponseDto> getParentStatuses() {
        return java.util.Arrays.stream(ParentStatus.values())
                .filter(status -> status != ParentStatus.UNKNOWN)
                .map(status -> LabelValueResponseDto.builder()
                        .value(status.getValue())
                        .label(status.getLabel())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<LabelValueResponseDto> getParentOccupations() {
        return java.util.Arrays.stream(ParentOccupation.values())
                .map(occupation -> LabelValueResponseDto.builder()
                        .value(occupation.getValue())
                        .label(occupation.getLabel())
                        .build())
                .collect(Collectors.toList());
    }
}
