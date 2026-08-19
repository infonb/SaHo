package com.saho.foundation.controller;

import com.saho.foundation.dto.DependencyCheckResponseDto;
import com.saho.foundation.dto.MasterPageResponseDto;
import com.saho.foundation.service.iservices.MasterManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/masters")
@RequiredArgsConstructor
public class MasterManagementController {

    private final MasterManagementService masterManagementService;

    @GetMapping("/{type}")
    public MasterPageResponseDto list(
            @PathVariable String type,
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return masterManagementService.list(type, search, page, size);
    }

    @GetMapping("/{type}/{id}")
    public Map<String, Object> get(@PathVariable String type, @PathVariable Integer id) {
        return masterManagementService.get(type, id);
    }

    @GetMapping("/{type}/{id}/dependency-check")
    public DependencyCheckResponseDto checkDependencies(@PathVariable String type, @PathVariable Integer id) {
        return masterManagementService.checkDependencies(type, id);
    }

    @PostMapping("/{type}")
    public Map<String, Object> create(@PathVariable String type, @RequestBody Map<String, Object> body) {
        return masterManagementService.create(type, body);
    }

    @PutMapping("/{type}/{id}")
    public Map<String, Object> update(@PathVariable String type, @PathVariable Integer id,
                                      @RequestBody Map<String, Object> body) {
        return masterManagementService.update(type, id, body);
    }

    @DeleteMapping("/{type}/{id}")
    public void delete(@PathVariable String type, @PathVariable Integer id) {
        masterManagementService.delete(type, id);
    }
}