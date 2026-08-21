// package com.saho.foundation.ai.handler.student;

// import java.util.Map;

// public record StudentActionContext(
//     String status,
//     String genderValue,
//     String genderLabel,
//     boolean orphan,
//     boolean sponsored,
//     Map<String, Object> rawFilters
// ) {
// }


package com.saho.foundation.ai.handler.student;

import java.util.Map;

public record StudentActionContext(
    String status,
    String studentName,
    String sponsorName,
    String schoolName,
    String districtName,
    String stateName,
    String genderValue,
    String genderLabel,
    String classId,
    String orphanStatusValue,

    boolean orphan,
    boolean semiOrphan,
    boolean sponsored,

    Map<String, Object> rawFilters
) {
}
