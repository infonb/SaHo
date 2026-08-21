package com.saho.foundation.service.impl;

import com.saho.foundation.entity.DistrictMaster;
import com.saho.foundation.entity.MandalMaster;
import com.saho.foundation.entity.SchoolMaster;
import com.saho.foundation.entity.StateMaster;
import com.saho.foundation.entity.VillageMaster;
import com.saho.foundation.repository.DistrictRepository;
import com.saho.foundation.repository.MandalRepository;
import com.saho.foundation.repository.SchoolRepository;
import com.saho.foundation.repository.StateRepository;
import com.saho.foundation.repository.VillageRepository;
import com.saho.foundation.service.iservices.LocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LocationServiceImpl implements LocationService {

    private final StateRepository stateRepository;
    private final DistrictRepository districtRepository;
    private final MandalRepository mandalRepository;
    private final VillageRepository villageRepository;
    private final SchoolRepository schoolRepository;

    @Override
    public List<StateMaster> getAllStates() {
        return stateRepository.findByIsDeletedFalse();
    }

    @Override
    public List<DistrictMaster> getDistrictsByStateId(Integer stateId) {
        return districtRepository.findByStId(stateId);
    }

    @Override
    public List<MandalMaster> getMandalsByDistrictId(Integer districtId) {
        return mandalRepository.findByDistId(districtId);
    }

    @Override
    public List<VillageMaster> getVillagesByMandalId(Integer mandalId) {
        return villageRepository.findByMndlId(mandalId);
    }

    @Override
    public List<SchoolMaster> getSchoolsByVillageId(Integer villageId) {
        return schoolRepository.findByVilId(villageId);
    }

    @Override
    public List<SchoolMaster> getAllSchools() {
        return schoolRepository.findByIsDeletedFalse();
    }
}
