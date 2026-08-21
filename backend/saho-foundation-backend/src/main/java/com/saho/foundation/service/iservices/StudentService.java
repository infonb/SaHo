package com.saho.foundation.service.iservices;

import com.saho.foundation.dto.StudentListResponseDto;
import com.saho.foundation.dto.StudentDetailsResponseDto;
import com.saho.foundation.dto.StudentRequestDto;
import com.saho.foundation.dto.StudentPaginationResponseDto;
import com.saho.foundation.dto.StudentAcademicResponseDto;
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
            String academicYearId,
            String parentType,
            String parentOccupation,
            String sortColumn,
            String sortDirection
    );

    List<StudentListResponseDto> searchStudents(
            String studentName,
            String schoolName,
            String districtName,
            String stateName,
            String gender,
            String classId,
            String orphanStatus,
            boolean sponsored
    );

    default List<StudentListResponseDto> searchStudents(
            String studentName,
            String schoolName,
            String gender,
            String classId,
            String orphanStatus,
            boolean sponsored
    ) {
        return searchStudents(
            studentName,
            schoolName,
            null,
            null,
            gender,
            classId,
            orphanStatus,
            sponsored
        );
    }

    List<StudentListResponseDto> searchStudentsBySponsorName(
            String sponsorName,
            String studentName,
            String schoolName,
            String districtName,
            String stateName,
            String gender,
            String classId,
            String orphanStatus,
            boolean sponsored
    );

    default List<StudentListResponseDto> searchStudentsBySponsorName(
            String sponsorName,
            String studentName,
            String schoolName,
            String gender,
            String classId,
            String orphanStatus,
            boolean sponsored
    ) {
        return searchStudentsBySponsorName(
            sponsorName,
            studentName,
            schoolName,
            null,
            null,
            gender,
            classId,
            orphanStatus,
            sponsored
        );
    }

    java.util.Optional<StudentDetailsResponseDto> getStudentDetailsByName(String studentName);

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
            String academicYearId,
            String parentType,
            String parentOccupation,
            String sortColumn,
            String sortDirection,
            String studentIdsCsv
    );

    StudentProfileResponseDto getStudentById(Integer studentId);

    StudentAcademicResponseDto getStudentAcademicById(Integer studentId);

    StudentProfileResponseDto getStudentProfileByUserId(Integer userId);

    StudentSiblingSearchResponseDto getStudentByAadhaarNumber(String aadhaarNumber);

    List<StudentSiblingInfoDto> getSiblingsByStudentId(Integer studentId);

    long countStudentsByOrphanStatus(String orphanStatus);

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
            String schId,
            String academicYearId,
            String parentType,
            String parentOccupation
    );
}
