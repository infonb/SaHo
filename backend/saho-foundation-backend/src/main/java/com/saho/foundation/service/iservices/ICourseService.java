package com.saho.foundation.service.iservices;

import com.saho.foundation.dto.CourseResponseDto;
import com.saho.foundation.dto.CourseSubjectMarksDto;

import java.util.List;

public interface ICourseService {

    List<CourseResponseDto> getAllCourses();

    List<CourseSubjectMarksDto> getCourseSubjectsByClass(Integer classId);
}
