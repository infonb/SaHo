package com.saho.foundation.service.impl;

import com.saho.foundation.dto.StudentListResponseDto;
import com.saho.foundation.dto.StudentPaginationResponseDto;
import com.saho.foundation.dto.StudentProfileResponseDto;
import com.saho.foundation.dto.StudentRequestDto;
import com.saho.foundation.dto.StudentResponseDto;
import com.saho.foundation.dto.StudentSiblingSearchResponseDto;
import com.saho.foundation.entity.Guardian;
import com.saho.foundation.entity.SchoolMaster;
import com.saho.foundation.entity.Student;
import com.saho.foundation.enums.Gender;
import com.saho.foundation.enums.OrphanStatus;
import com.saho.foundation.enums.Religion;
import com.saho.foundation.exception.DuplicateResourceException;
import com.saho.foundation.exception.ResourceNotFoundException;
import com.saho.foundation.repository.GuardianRepository;
import com.saho.foundation.repository.SchoolRepository;
import com.saho.foundation.repository.StudentRepository;
import com.saho.foundation.service.iservices.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentServiceImpl implements StudentService {

    private final StudentRepository studentRepository;
    private final GuardianRepository guardianRepository;
    private final SchoolRepository schoolRepository;

    @Override
    @Transactional
    public StudentResponseDto createStudent(StudentRequestDto requestDto) {
        if (studentRepository.existsByEmailId(requestDto.getEmailId())) {
            throw new DuplicateResourceException("emailId already exists");
        }

        if (studentRepository.existsByAadhaarNumber(requestDto.getAadhaarNumber())) {
            throw new DuplicateResourceException("aadhaarNumber already exists");
        }

        // Call guardian procedure first, then read the generated guardian id.
        guardianRepository.createOrUpdateGuardian(
                null,
                requestDto.getGuardian().getFirstName(),
                requestDto.getGuardian().getMiddleName(),
                requestDto.getGuardian().getLastName(),
                requestDto.getGuardian().getPhoneNumber(),
                requestDto.getGuardian().getRelationshipId(),
                requestDto.getGuardian().getOcc(),
                requestDto.getGuardian().getAddr()
        );

        Integer guardianId = guardianRepository.findTopByFirstNameAndLastNameAndPhoneNumberOrderByGuardianIdDesc(
                        requestDto.getGuardian().getFirstName(),
                        requestDto.getGuardian().getLastName(),
                        requestDto.getGuardian().getPhoneNumber()
                )
                .map(Guardian::getGuardianId)
                .orElseThrow(() -> new ResourceNotFoundException("Guardian not found after procedure call"));

        studentRepository.createOrUpdateStudent(
                null,
                requestDto.getFirstName(),
                requestDto.getMiddleName(),
                requestDto.getLastName(),
                requestDto.getEmailId(),
                requestDto.getDob(),
                requestDto.getGender(),
                requestDto.getAadhaarNumber(),
                requestDto.getCasteId(),
                requestDto.getReligion(),
                requestDto.getBloodGroup(),
                requestDto.getSchId(),
                requestDto.getClassId(),
                guardianId,
                // Store selected sibling student ids as CSV in students.sibling_id. If no sibling, save null.
                Boolean.TRUE.equals(requestDto.getHasSibling()) ? requestDto.getSiblingIds() : null,
                requestDto.getOrphanStatus(),
                requestDto.getImageUrl(),
                requestDto.getCreatedBy()
        );

        Student savedStudent = studentRepository.findByAadhaarNumber(requestDto.getAadhaarNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found after procedure call for aadhaarNumber: " + requestDto.getAadhaarNumber()));
        return mapToResponseDto(savedStudent);
    }

    @Override
    @Transactional(readOnly = true)
    public StudentPaginationResponseDto getAllStudents(Integer pageNumber, Integer pageSize) {
        List<StudentListResponseDto> students = studentRepository.getAllStudentsWithPagination(pageNumber, pageSize)
                .stream()
                .map(this::mapStudentListResponse)
                .toList();

        return StudentPaginationResponseDto.builder()
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .students(students)
                .build();
    }

    @Override
    public StudentProfileResponseDto getStudentById(Integer studentId) {
        return studentRepository.getStudentProfileById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));
    }

    @Override
    public StudentSiblingSearchResponseDto getStudentByAadhaarNumber(String aadhaarNumber) {
        Student student = studentRepository.findByAadhaarNumber(aadhaarNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with aadhaarNumber: " + aadhaarNumber));

        SchoolMaster school = schoolRepository.findById(student.getSchId())
                .orElse(null);

        return StudentSiblingSearchResponseDto.builder()
                .studentId(student.getStudentId())
                .studentName(buildStudentName(student))
                .classId(student.getClassId())
                .schoolName(school != null ? school.getSchName() : null)
                .build();
    }

    @Override
    @Transactional
    public StudentResponseDto updateStudent(Integer studentId, StudentRequestDto requestDto) {
        Student existingStudent = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        if (Boolean.TRUE.equals(existingStudent.getIsDeleted())) {
            throw new ResourceNotFoundException("Student not found with id: " + studentId);
        }

        if (studentRepository.existsByEmailIdAndStudentIdNot(requestDto.getEmailId(), studentId)) {
            throw new DuplicateResourceException("emailId already exists");
        }

        if (studentRepository.existsByAadhaarNumberAndStudentIdNot(requestDto.getAadhaarNumber(), studentId)) {
            throw new DuplicateResourceException("aadhaarNumber already exists");
        }

        Integer guardianId = existingStudent.getGuardian() != null ? existingStudent.getGuardian().getGuardianId() : null;

        // Update guardian details also when guardian data is provided.
        if (requestDto.getGuardian() != null && guardianId != null) {
            guardianRepository.createOrUpdateGuardian(
                    guardianId,
                    requestDto.getGuardian().getFirstName(),
                    requestDto.getGuardian().getMiddleName(),
                    requestDto.getGuardian().getLastName(),
                    requestDto.getGuardian().getPhoneNumber(),
                    requestDto.getGuardian().getRelationshipId(),
                    requestDto.getGuardian().getOcc(),
                    requestDto.getGuardian().getAddr()
            );
        }

        studentRepository.createOrUpdateStudent(
                existingStudent.getStudentId(),
                requestDto.getFirstName(),
                requestDto.getMiddleName(),
                requestDto.getLastName(),
                requestDto.getEmailId(),
                requestDto.getDob(),
                requestDto.getGender(),
                requestDto.getAadhaarNumber(),
                requestDto.getCasteId(),
                requestDto.getReligion(),
                requestDto.getBloodGroup(),
                requestDto.getSchId(),
                requestDto.getClassId(),
                guardianId,
                Boolean.TRUE.equals(requestDto.getHasSibling()) ? requestDto.getSiblingIds() : null,
                requestDto.getOrphanStatus(),
                requestDto.getImageUrl(),
                requestDto.getCreatedBy()
        );

        Student updatedStudent = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found after update with id: " + studentId));

        return mapToResponseDto(updatedStudent);
    }

    @Override
    @Transactional
    public void deleteStudent(Integer studentId) {
        Student existingStudent = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        if (Boolean.TRUE.equals(existingStudent.getIsDeleted())) {
            throw new ResourceNotFoundException("Student not found with id: " + studentId);
        }

        // Use the database soft-delete procedure so delete logic stays in PostgreSQL.
        studentRepository.deleteStudent(
                new Integer[]{studentId},
                existingStudent.getCreatedBy()
        );
    }

    private StudentResponseDto mapToResponseDto(Student student) {
        Guardian guardian = student.getGuardian();

        return StudentResponseDto.builder()
                .studentId(student.getStudentId())
                .firstName(student.getFirstName())
                .middleName(student.getMiddleName())
                .lastName(student.getLastName())
                .emailId(student.getEmailId())
                .dob(student.getDob())
                .gender(resolveGenderLabel(student.getGender()))
                .aadhaarNumber(student.getAadhaarNumber())
                .casteId(student.getCasteId())
                .religion(resolveReligionLabel(student.getReligion()))
                .bloodGroup(student.getBloodGroup())
                .schId(student.getSchId())
                .classId(student.getClassId())
                .siblingId(student.getSiblingId())
                .guardianId(guardian != null ? guardian.getGuardianId() : null)
                .orphanStatus(resolveOrphanStatusLabel(student.getOrphanStatus()))
                .imageUrl(student.getImageUrl())
                .isDeleted(student.getIsDeleted())
                .createdAt(student.getCreatedAt())
                .createdBy(student.getCreatedBy())
                .modifiedAt(student.getModifiedAt())
                .modifiedBy(student.getModifiedBy())
                .guardian(mapGuardianDto(guardian))
                .build();
    }

    private String buildStudentName(Student student) {
        String middleName = student.getMiddleName() != null ? student.getMiddleName() + " " : "";
        return student.getFirstName() + " " + middleName + student.getLastName();
    }

    private StudentResponseDto.GuardianDto mapGuardianDto(Guardian guardian) {
        if (guardian == null) {
            return null;
        }

        return StudentResponseDto.GuardianDto.builder()
                .guardianId(guardian.getGuardianId())
                .firstName(guardian.getFirstName())
                .middleName(guardian.getMiddleName())
                .lastName(guardian.getLastName())
                .phoneNumber(guardian.getPhoneNumber())
                .relationshipId(guardian.getRelationshipId())
                .occ(guardian.getOcc())
                .addr(guardian.getAddr())
                .isDeleted(guardian.getIsDeleted())
                .createdAt(guardian.getCreatedAt())
                .updatedAt(guardian.getUpdatedAt())
                .build();
    }

    private StudentListResponseDto mapStudentListResponse(StudentListResponseDto student) {
        return StudentListResponseDto.builder()
                .studentId(student.getStudentId())
                .name(student.getName())
                .emailId(student.getEmailId())
                .dob(student.getDob())
                .gender(resolveGenderLabel(student.getGender()))
                .aadhaarNumber(student.getAadhaarNumber())
                .casteId(student.getCasteId())
                .religion(resolveReligionLabel(student.getReligion()))
                .bloodGroup(student.getBloodGroup())
                .schId(student.getSchId())
                .classId(student.getClassId())
                .guardianId(student.getGuardianId())
                .siblingId(student.getSiblingId())
                .orphanStatus(resolveOrphanStatusLabel(student.getOrphanStatus()))
                .imageUrl(student.getImageUrl())
                .createdAt(student.getCreatedAt())
                .createdBy(student.getCreatedBy())
                .modifiedAt(student.getModifiedAt())
                .modifiedBy(student.getModifiedBy())
                .build();
    }

    private String resolveGenderLabel(String value) {
        if (value == null) {
            return null;
        }
        String label = Gender.getLabelByValue(value);
        return label != null ? label : value;
    }

    private String resolveReligionLabel(String value) {
        if (value == null) {
            return null;
        }
        String label = Religion.getLabelByValue(value);
        return label != null ? label : value;
    }

    private String resolveOrphanStatusLabel(String value) {
        if (value == null) {
            return null;
        }
        String label = OrphanStatus.getLabelByValue(value);
        return label != null ? label : value;
    }
}
