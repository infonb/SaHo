package com.saho.foundation.service.iservices;

import com.saho.foundation.dto.DependencyCheckResponseDto;
import com.saho.foundation.dto.MasterPageResponseDto;

import java.util.Map;

public interface MasterManagementService {

    MasterPageResponseDto list(String type, String search, int page, int size);

    Map<String, Object> get(String type, Integer id);

    Map<String, Object> create(String type, Map<String, Object> body);

    Map<String, Object> update(String type, Integer id, Map<String, Object> body);

    void delete(String type, Integer id);

    DependencyCheckResponseDto checkDependencies(String type, Integer id);
}