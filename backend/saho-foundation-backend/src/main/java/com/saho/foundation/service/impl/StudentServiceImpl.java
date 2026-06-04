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
import org.springframework.http.MediaType;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.HashSet;
import java.util.stream.Collectors;

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
        syncSiblingPair(savedStudent.getStudentId(), requestDto.getSiblingIds(), Boolean.TRUE.equals(requestDto.getHasSibling()));
        return mapToResponseDto(savedStudent);
    }

    @Override
    @Transactional(readOnly = true)
    public StudentPaginationResponseDto getAllStudents(
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
        ) {
        List<StudentListResponseDto> students = studentRepository.getAllStudentsWithPagination(
                search,
                pageNumber,
                pageSize,
                gender,
                classId,
                orphanStatus,
                stId,
                distId,
                mndlId,
                vilId,
                schId,
                sortColumn,
                sortDirection
        )
            .stream()
            .map(this::mapStudentListResponse)
            .toList();

        int resolvedTotalCount = 0;
        if (!students.isEmpty()) {
            Integer firstRowTotalCount = students.get(0).getTotalCount();
            resolvedTotalCount = firstRowTotalCount != null ? firstRowTotalCount : students.size();
        }

        return StudentPaginationResponseDto.builder()
            .pageNumber(pageNumber)
            .pageSize(pageSize)
            .totalCount(resolvedTotalCount)
            .students(students)
            .build();
        }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportStudentsCsv(
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
    ) {
        List<StudentListResponseDto> students = studentRepository.getAllStudentsWithPagination(
                search,
                1,
                Integer.MAX_VALUE,
                gender,
                classId,
                orphanStatus,
                stId,
                distId,
                mndlId,
                vilId,
                schId,
                sortColumn,
                sortDirection
        );

        java.util.Set<Integer> selectedIds = parseStudentIds(studentIdsCsv);
        if (!selectedIds.isEmpty()) {
            students = students.stream()
                    .filter(student -> selectedIds.contains(student.getStudentId()))
                    .toList();
        }

        StringBuilder csv = new StringBuilder();
        csv.append("Student ID,Student Name,Age,Class,School Name,Gender,Orphan Status,Sponsor\n");

        for (StudentListResponseDto student : students) {
            csv.append(csvValue(student.getStudentId()))
                    .append(',')
                    .append(csvValue(student.getName()))
                    .append(',')
                    .append(csvValue(ageFromDob(student.getDob())))
                    .append(',')
                    .append(csvValue(student.getClassName() != null ? student.getClassName() : student.getClassId()))
                    .append(',')
                    .append(csvValue(student.getSchName()))
                    .append(',')
                    .append(csvValue(resolveGenderLabel(student.getGender())))
                    .append(',')
                    .append(csvValue(resolveOrphanStatusLabel(student.getOrphanStatus())))
                    .append(',')
                    .append(csvValue(""))
                    .append('\n');
        }

        return csv.toString().getBytes(StandardCharsets.UTF_8);
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

        Integer previousSiblingId = firstStudentId(existingStudent.getSiblingId());
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
        syncSiblingOnUpdate(updatedStudent.getStudentId(), previousSiblingId, requestDto.getSiblingIds(), Boolean.TRUE.equals(requestDto.getHasSibling()));

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
                .schAddress(student.getSchAddress())
                .schName(student.getSchName())
                .className(student.getClassName())
                .guardianName(student.getGuardianName())
                .guardianId(student.getGuardianId())
                .guardianRelationName(student.getGuardianRelationName())
                .vilName(student.getVilName())
                .mndlName(student.getMndlName())
                .distName(student.getDistName())
                .stName(student.getStName())
                .siblingId(student.getSiblingId())
                .orphanStatus(resolveOrphanStatusLabel(student.getOrphanStatus()))
                .sponsorId(student.getSponsorId())
                .sponsorName(student.getSponsorName())
                .totalCount(student.getTotalCount())
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

    private Integer ageFromDob(java.time.LocalDate dob) {
        if (dob == null) {
            return null;
        }
        java.time.Period period = java.time.Period.between(dob, java.time.LocalDate.now());
        return period.getYears();
    }

    private String csvValue(Object value) {
        String text = value == null ? "" : String.valueOf(value);
        if (text.contains("\"") || text.contains(",") || text.contains("\n")) {
            return "\"" + text.replace("\"", "\"\"") + "\"";
        }
        return text;
    }

    private void syncSiblingPair(Integer currentStudentId, String siblingIdsCsv, boolean hasSibling) {
        if (currentStudentId == null || !hasSibling) {
            return;
        }

        Integer siblingId = firstStudentId(siblingIdsCsv);
        if (siblingId == null || siblingId.equals(currentStudentId)) {
            return;
        }

        Student currentStudent = studentRepository.findById(currentStudentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + currentStudentId));
        Student siblingStudent = studentRepository.findById(siblingId)
                .orElseThrow(() -> new ResourceNotFoundException("Sibling student not found with id: " + siblingId));

        currentStudent.setSiblingId(String.valueOf(siblingId));
        siblingStudent.setSiblingId(String.valueOf(currentStudentId));
        studentRepository.save(currentStudent);
        studentRepository.flush();
        studentRepository.saveAndFlush(siblingStudent);
    }

    private void syncSiblingOnUpdate(Integer currentStudentId, Integer previousSiblingId, String siblingIdsCsv, boolean hasSibling) {
        // Remove the old sibling link first if the sibling changed.
        if (previousSiblingId != null) {
            try {
                Student previousSibling = studentRepository.findById(previousSiblingId)
                        .orElse(null);
                if (previousSibling != null) {
                    Set<Integer> previousIds = parseStudentIds(previousSibling.getSiblingId());
                    previousIds.remove(currentStudentId);
                    previousSibling.setSiblingId(joinStudentIds(previousIds));
                    studentRepository.saveAndFlush(previousSibling);
                }
            } catch (Exception ignored) {
                // Ignore cleanup failures here so the new relationship can still be applied.
            }
        }

        // Apply the new sibling relationship.
        syncSiblingPair(currentStudentId, siblingIdsCsv, hasSibling);
    }

    private Set<Integer> parseStudentIds(String studentIdsCsv) {
        if (studentIdsCsv == null || studentIdsCsv.isBlank()) {
            return Collections.emptySet();
        }

        Set<Integer> ids = new LinkedHashSet<>();
        for (String part : studentIdsCsv.split(",")) {
            String trimmed = part == null ? "" : part.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            try {
                Integer parsed = Integer.parseInt(trimmed);
                if (parsed > 0) {
                    ids.add(parsed);
                }
            } catch (NumberFormatException ignored) {
                // Ignore invalid ids and keep the rest of the group intact.
            }
        }
        return ids;
    }

    private Integer firstStudentId(String studentIdsCsv) {
        Set<Integer> ids = parseStudentIds(studentIdsCsv);
        return ids.stream().findFirst().orElse(null);
    }

    private String joinStudentIds(Collection<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return null;
        }

        return ids.stream()
                .filter(id -> id != null && id > 0)
                .distinct()
                .sorted()
                .map(String::valueOf)
                .collect(Collectors.joining(","));
    }
}
