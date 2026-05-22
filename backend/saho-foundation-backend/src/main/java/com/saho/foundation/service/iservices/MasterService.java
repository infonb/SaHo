package com.saho.foundation.service.iservices;

import com.saho.foundation.dto.CasteResponseDto;
import com.saho.foundation.dto.RelationshipResponseDto;

import java.util.List;

public interface MasterService {

    List<CasteResponseDto> getAllCastes();

    List<RelationshipResponseDto> getAllRelationships();
}