package com.saho.foundation.controller;

import com.saho.foundation.entity.DistrictMaster;
import com.saho.foundation.entity.MandalMaster;
import com.saho.foundation.entity.SchoolMaster;
import com.saho.foundation.entity.StateMaster;
import com.saho.foundation.entity.VillageMaster;
import com.saho.foundation.service.iservices.LocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

    @GetMapping("/states")
    public List<StateMaster> getStates() {
        return locationService.getAllStates();
    }

    @GetMapping("/districts/{stateId}")
    public List<DistrictMaster> getDistricts(@PathVariable Integer stateId) {
        return locationService.getDistrictsByStateId(stateId);
    }

    @GetMapping("/mandals/{districtId}")
    public List<MandalMaster> getMandals(@PathVariable Integer districtId) {
        return locationService.getMandalsByDistrictId(districtId);
    }

    @GetMapping("/villages/{mandalId}")
    public List<VillageMaster> getVillages(@PathVariable Integer mandalId) {
        return locationService.getVillagesByMandalId(mandalId);
    }

    @GetMapping("/schools/{villageId}")
    public List<SchoolMaster> getSchools(@PathVariable Integer villageId) {
        return locationService.getSchoolsByVillageId(villageId);
    }
}
