package com.saho.foundation.service.impl.master;

import com.saho.foundation.dto.DependencyCheckResponseDto;
import com.saho.foundation.dto.MasterPageResponseDto;

import java.util.Map;

public interface MasterCrudHandler {

    String type();

    String displayName();

    MasterPageResponseDto list(String search, int page, int size);

    Map<String, Object> get(Integer id);

    Map<String, Object> create(Map<String, Object> body);

    Map<String, Object> update(Integer id, Map<String, Object> body);

    void delete(Integer id);

    DependencyCheckResponseDto checkDependencies(Integer id);
}