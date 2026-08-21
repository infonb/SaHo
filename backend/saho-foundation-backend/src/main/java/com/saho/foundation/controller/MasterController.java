package com.saho.foundation.controller;

import com.saho.foundation.dto.CasteResponseDto;
import com.saho.foundation.dto.ClassResponseDto;
import com.saho.foundation.dto.LabelValueResponseDto;
import com.saho.foundation.dto.RelationshipResponseDto;
import com.saho.foundation.service.iservices.MasterService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/master")
@RequiredArgsConstructor
public class MasterController {

    private final MasterService masterService;

    @GetMapping("/castes")
    public List<CasteResponseDto> getCastes() {
        return masterService.getAllCastes();
    }

    @GetMapping("/relationships")
    public List<RelationshipResponseDto> getRelationships() {
        return masterService.getAllRelationships();
    }

    @GetMapping("/classes")
    public List<ClassResponseDto> getClasses() {
        return masterService.getAllClasses();
    }

    @GetMapping("/parent-statuses")
    public List<LabelValueResponseDto> getParentStatuses() {
        return masterService.getParentStatuses();
    }

    @GetMapping("/parent-occupations")
    public List<LabelValueResponseDto> getParentOccupations() {
        return masterService.getParentOccupations();
    }

    @GetMapping("/admission-types")
    public List<LabelValueResponseDto> getAdmissionTypes() {
        return masterService.getAdmissionTypes();
    }

    @GetMapping("/academic-statuses")
    public List<LabelValueResponseDto> getAcademicStatuses() {
        return masterService.getAcademicStatuses();
    }
}
