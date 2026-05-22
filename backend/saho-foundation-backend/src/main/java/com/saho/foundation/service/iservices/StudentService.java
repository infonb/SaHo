package com.saho.foundation.service.iservices;

import com.saho.foundation.dto.StudentRequestDto;
import com.saho.foundation.dto.StudentPaginationResponseDto;
import com.saho.foundation.dto.StudentProfileResponseDto;
import com.saho.foundation.dto.StudentResponseDto;
import com.saho.foundation.dto.StudentSiblingSearchResponseDto;

import java.util.List;

public interface StudentService {
    StudentResponseDto createStudent(StudentRequestDto requestDto);

    StudentPaginationResponseDto getAllStudents(Integer pageNumber, Integer pageSize);

    StudentProfileResponseDto getStudentById(Integer studentId);

    StudentSiblingSearchResponseDto getStudentByAadhaarNumber(String aadhaarNumber);

    StudentResponseDto updateStudent(Integer studentId, StudentRequestDto requestDto);

    void deleteStudent(Integer studentId);
}
