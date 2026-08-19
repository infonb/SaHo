package com.saho.foundation.service.impl;

import com.saho.foundation.dto.DependencyCheckResponseDto;
import com.saho.foundation.dto.MasterPageResponseDto;
import com.saho.foundation.service.impl.master.MasterCrudHandler;
import com.saho.foundation.service.iservices.MasterManagementService;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class MasterManagementServiceImpl implements MasterManagementService {

    private final Map<String, MasterCrudHandler> handlers = new LinkedHashMap<>();

    public MasterManagementServiceImpl(List<MasterCrudHandler> handlerList) {
        for (MasterCrudHandler handler : handlerList) {
            handlers.put(handler.type(), handler);
        }
    }

    private MasterCrudHandler handler(String type) {
        MasterCrudHandler handler = handlers.get(type);
        if (handler == null) {
            throw new IllegalArgumentException("Unknown master type: " + type);
        }
        return handler;
    }

    @Override
    public MasterPageResponseDto list(String type, String search, int page, int size) {
        return handler(type).list(search, page, size);
    }

    @Override
    public Map<String, Object> get(String type, Integer id) {
        return handler(type).get(id);
    }

    @Override
    public Map<String, Object> create(String type, Map<String, Object> body) {
        return handler(type).create(body);
    }

    @Override
    public Map<String, Object> update(String type, Integer id, Map<String, Object> body) {
        return handler(type).update(id, body);
    }

    @Override
    public void delete(String type, Integer id) {
        handler(type).delete(id);
    }

    @Override
    public DependencyCheckResponseDto checkDependencies(String type, Integer id) {
        return handler(type).checkDependencies(id);
    }
}