package com.saho.foundation.service.impl;

import com.saho.foundation.dto.CasteResponseDto;
import com.saho.foundation.dto.RelationshipResponseDto;
import com.saho.foundation.entity.CasteMaster;
import com.saho.foundation.entity.RelationshipMaster;
import com.saho.foundation.repository.CasteRepository;
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
}