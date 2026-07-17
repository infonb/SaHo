package com.saho.foundation.service.iservices;

import com.saho.foundation.dto.StudentRequestDto;
import com.saho.foundation.dto.StudentPaginationResponseDto;
import com.saho.foundation.dto.StudentProfileResponseDto;
import com.saho.foundation.dto.StudentResponseDto;
import com.saho.foundation.dto.StudentSiblingInfoDto;
import com.saho.foundation.dto.StudentSiblingSearchResponseDto;

import java.util.List;

public interface StudentService {
    StudentResponseDto createStudent(StudentRequestDto requestDto);

    StudentPaginationResponseDto getAllStudents(
            String search,
            Integer pageNumber,
            Integer pageSize,
            String gender,
            String classId,
            String orphanStatus,
            String stId,
            String distId,
            String mndlId,
            String vilId,
            String schId,
            String sortColumn,
            String sortDirection
    );

    byte[] exportStudentsExcel(
            String search,
            String gender,
            String classId,
            String orphanStatus,
            String stId,
            String distId,
            String mndlId,
            String vilId,
            String schId,
            String sortColumn,
            String sortDirection,
            String studentIdsCsv
    );

    StudentProfileResponseDto getStudentById(Integer studentId);

    StudentProfileResponseDto getStudentProfileByUserId(Integer userId);

    StudentSiblingSearchResponseDto getStudentByAadhaarNumber(String aadhaarNumber);

    List<StudentSiblingInfoDto> getSiblingsByStudentId(Integer studentId);

    StudentResponseDto updateStudent(Integer studentId, StudentRequestDto requestDto);

    void deleteStudent(Integer studentId);

    List<Integer> getAllStudentIds(
            String search,
            String gender,
            String classId,
            String orphanStatus,
            String stId,
            String distId,
            String mndlId,
            String vilId,
            String schId
    );
}
