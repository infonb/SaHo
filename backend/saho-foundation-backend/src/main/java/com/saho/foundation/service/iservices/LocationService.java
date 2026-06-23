package com.saho.foundation.service.iservices;

import com.saho.foundation.entity.DistrictMaster;
import com.saho.foundation.entity.MandalMaster;
import com.saho.foundation.entity.SchoolMaster;
import com.saho.foundation.entity.StateMaster;
import com.saho.foundation.entity.VillageMaster;

import java.util.List;

public interface LocationService {

    List<StateMaster> getAllStates();

    List<DistrictMaster> getDistrictsByStateId(Integer stateId);

    List<MandalMaster> getMandalsByDistrictId(Integer districtId);

    List<VillageMaster> getVillagesByMandalId(Integer mandalId);

    List<SchoolMaster> getSchoolsByVillageId(Integer villageId);

    List<SchoolMaster> getAllSchools();
}
