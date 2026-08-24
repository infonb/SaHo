package com.saho.foundation.service.impl;

import com.saho.foundation.dto.StudentAcademicRequestDto;
import com.saho.foundation.dto.StudentAcademicResponseDto;
import com.saho.foundation.dto.StudentListResponseDto;
import com.saho.foundation.dto.StudentDetailsResponseDto;
import com.saho.foundation.dto.StudentPaginationResponseDto;
import com.saho.foundation.dto.StudentProfileResponseDto;
import com.saho.foundation.dto.StudentRequestDto;
import com.saho.foundation.dto.StudentResponseDto;
import com.saho.foundation.dto.StudentSiblingInfoDto;
import com.saho.foundation.dto.StudentSiblingSearchResponseDto;
import com.saho.foundation.entity.AcademicYear;
import com.saho.foundation.entity.ClassMaster;
import com.saho.foundation.entity.Guardian;
import com.saho.foundation.entity.SchoolMaster;
import com.saho.foundation.entity.Student;
import com.saho.foundation.entity.StudentAcademic;
import com.saho.foundation.entity.StudentFamily;
import com.saho.foundation.entity.StudentMarks;
import com.saho.foundation.entity.User;
import com.saho.foundation.enums.AdmissionType;
import com.saho.foundation.enums.Gender;
import com.saho.foundation.enums.OrphanStatus;
import com.saho.foundation.enums.ParentStatus;
import com.saho.foundation.enums.Religion;
import com.saho.foundation.enums.StudentAcademicStatus;
import com.saho.foundation.exception.DuplicateResourceException;
import com.saho.foundation.exception.ResourceNotFoundException;
import com.saho.foundation.repository.AcademicYearRepository;
import com.saho.foundation.repository.ClassRepository;
import com.saho.foundation.repository.DistrictRepository;
import com.saho.foundation.repository.GuardianRepository;
import com.saho.foundation.repository.MandalRepository;
import com.saho.foundation.repository.RelationshipRepository;
import com.saho.foundation.repository.SchoolRepository;
import com.saho.foundation.repository.SponsorRepository;
import com.saho.foundation.repository.StudentAcademicRepository;
import com.saho.foundation.repository.StudentMarksRepository;
import com.saho.foundation.repository.StudentRepository;
import com.saho.foundation.repository.StudentSponsorRepository;
import com.saho.foundation.repository.StateRepository;
import com.saho.foundation.repository.UserRepository;
import com.saho.foundation.repository.VillageRepository;
import com.saho.foundation.service.iservices.StudentFamilyService;
import com.saho.foundation.service.iservices.StudentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Locale;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudentServiceImpl implements StudentService {

    private final StudentRepository studentRepository;
    private final StudentAcademicRepository studentAcademicRepository;
    private final GuardianRepository guardianRepository;
    private final AcademicYearRepository academicYearRepository;
    private final StudentFamilyService studentFamilyService;
    private final RelationshipRepository relationshipRepository;
    private final ClassRepository classRepository;
    private final SchoolRepository schoolRepository;
    private final SponsorRepository sponsorRepository;
    private final StudentSponsorRepository studentSponsorRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final StudentMarksRepository studentMarksRepository;
    private final DistrictRepository districtRepository;
    private final MandalRepository mandalRepository;
    private final VillageRepository villageRepository;
    private final StateRepository stateRepository;

    @Override
    @Transactional
    public StudentResponseDto createStudent(StudentRequestDto requestDto) {
        String normalizedEmail = requestDto.getEmailId().trim().toLowerCase();
        if (studentRepository.existsByEmailIdIgnoreCase(normalizedEmail)) {
            throw new DuplicateResourceException("emailId already exists");
        }

        if (studentRepository.existsByAadhaarNumber(requestDto.getAadhaarNumber())) {
            throw new DuplicateResourceException("aadhaarNumber already exists");
        }

        StudentFamily family = persistStudentFamily(requestDto, null);
        Integer guardianId = resolveGuardianId(requestDto, null);
        StudentAcademicRequestDto academicRequest = resolveAcademicRequest(requestDto, null);

        studentRepository.createOrUpdateStudentV2(
                null,
                requestDto.getFirstName(),
                requestDto.getLastName(),
                normalizedEmail,
                requestDto.getDob(),
                requestDto.getGender(),
                requestDto.getAadhaarNumber(),
                requestDto.getCasteId(),
                requestDto.getReligion(),
                requestDto.getBloodGroup(),
                family.getFamilyId(),
                guardianId,
                Boolean.TRUE.equals(requestDto.getHasSibling()) ? requestDto.getSiblingIds() : null,
                requestDto.getOrphanStatus(),
                requestDto.getImageUrl(),
                requestDto.getCreatedBy()
        );

        Student savedStudent = findStudentByAadhaar(requestDto.getAadhaarNumber());
        upsertStudentAcademic(savedStudent.getStudentId(), null, academicRequest, requestDto);

        if (userRepository.findByStudentId(savedStudent.getStudentId()).isEmpty()) {
            User user = User.builder()
                    .studentId(savedStudent.getStudentId())
                    .password(passwordEncoder.encode(savedStudent.getDob().format(DateTimeFormatter.ofPattern("ddMMyyyy"))))
                    .role("STUDENT")
                    .isActive(true)
                    .isDeleted(false)
                    .createdBy(String.valueOf(requestDto.getCreatedBy()))
                    .build();
            userRepository.save(user);
        }

        syncSiblingGroup(savedStudent.getStudentId(), Collections.emptySet(), requestDto.getSiblingIds(), Boolean.TRUE.equals(requestDto.getHasSibling()));
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
            String academicYearId,
            String parentType,
            String parentOccupation,
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
                        academicYearId,
                        parentType,
                        parentOccupation,
                        sortColumn,
                        sortDirection
                )
                .stream()
                .map(this::mapStudentListResponse)
                .toList();

        enrichAnnualResults(students);

        int resolvedTotalCount = 0;
        int resolvedBoysCount = 0;
        int resolvedGirlsCount = 0;
        int resolvedSponsoredCount = 0;
        int resolvedOrphansCount = 0;
        if (!students.isEmpty()) {
            StudentListResponseDto first = students.get(0);
            resolvedTotalCount = first.getTotalCount() != null ? first.getTotalCount() : students.size();
            resolvedBoysCount = first.getBoysCount() != null ? first.getBoysCount() : 0;
            resolvedGirlsCount = first.getGirlsCount() != null ? first.getGirlsCount() : 0;
            resolvedSponsoredCount = first.getSponsoredCount() != null ? first.getSponsoredCount() : 0;
            resolvedOrphansCount = first.getOrphansCount() != null ? first.getOrphansCount() : 0;
        }

        return StudentPaginationResponseDto.builder()
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .totalCount(resolvedTotalCount)
                .boysCount(resolvedBoysCount)
                .girlsCount(resolvedGirlsCount)
                .sponsoredCount(resolvedSponsoredCount)
                .orphansCount(resolvedOrphansCount)
                .students(students)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportStudentsExcel(
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
                academicYearId,
                parentType,
                parentOccupation,
                sortColumn,
                sortDirection
        );

        Set<Integer> selectedIds = parseStudentIds(studentIdsCsv);
        if (!selectedIds.isEmpty()) {
            students = students.stream()
                    .filter(student -> selectedIds.contains(student.getStudentId()))
                    .toList();
        }

        Set<Integer> exportedIds = students.stream()
                .map(StudentListResponseDto::getStudentId)
                .collect(Collectors.toSet());

        Map<Integer, IndexedColors> siblingColors = computeSiblingGroupColors(students, exportedIds);

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Students");

            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 11);

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            String[] headers = {
                    "Student ID", "Student Name", "Age", "Date of Birth", "Email", "Aadhaar Number",
                    "Gender", "Class", "School Name", "School Address",
                    "State", "District", "Mandal", "Village",
                    "Guardian Name", "Guardian Relation",
                    "Religion", "Blood Group", "Caste ID", "Orphan Status",
                    "Sponsor Name", "Created Date"
            };

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            Map<IndexedColors, CellStyle> colorStyles = new HashMap<>();

            int rowNum = 1;
            for (StudentListResponseDto student : students) {
                Row row = sheet.createRow(rowNum++);

                row.createCell(0).setCellValue(student.getStudentId() != null ? student.getStudentId().doubleValue() : 0);
                row.createCell(1).setCellValue(student.getName() != null ? student.getName() : "");
                row.createCell(2).setCellValue(ageFromDob(student.getDob()) != null ? ageFromDob(student.getDob()).doubleValue() : 0);
                row.createCell(3).setCellValue(student.getDob() != null ? student.getDob().toString() : "");
                row.createCell(4).setCellValue(student.getEmailId() != null ? student.getEmailId() : "");
                row.createCell(5).setCellValue(student.getAadhaarNumber() != null ? student.getAadhaarNumber() : "");
                row.createCell(6).setCellValue(resolveGenderLabel(student.getGender()));
                row.createCell(7).setCellValue(student.getClassName() != null ? student.getClassName() : (student.getClassId() != null ? student.getClassId().toString() : ""));
                row.createCell(8).setCellValue(student.getSchName() != null ? student.getSchName() : "");
                row.createCell(9).setCellValue(student.getSchAddress() != null ? student.getSchAddress() : "");
                row.createCell(10).setCellValue(student.getStName() != null ? student.getStName() : "");
                row.createCell(11).setCellValue(student.getDistName() != null ? student.getDistName() : "");
                row.createCell(12).setCellValue(student.getMndlName() != null ? student.getMndlName() : "");
                row.createCell(13).setCellValue(student.getVilName() != null ? student.getVilName() : "");
                row.createCell(14).setCellValue(student.getGuardianName() != null ? student.getGuardianName() : "");
                row.createCell(15).setCellValue(student.getGuardianRelationName() != null ? student.getGuardianRelationName() : "");
                row.createCell(16).setCellValue(student.getReligion() != null ? student.getReligion() : "");
                row.createCell(17).setCellValue(student.getBloodGroup() != null ? student.getBloodGroup() : "");
                row.createCell(18).setCellValue(student.getCasteId() != null ? student.getCasteId().doubleValue() : 0);
                row.createCell(19).setCellValue(resolveOrphanStatusLabel(student.getOrphanStatus()));
                row.createCell(20).setCellValue(student.getSponsorName() != null ? student.getSponsorName() : "");
                row.createCell(21).setCellValue(student.getCreatedAt() != null ? student.getCreatedAt().toString() : "");

                IndexedColors color = siblingColors.get(student.getStudentId());
                if (color != null) {
                    CellStyle style = colorStyles.get(color);
                    if (style == null) {
                        style = workbook.createCellStyle();
                        style.setFillForegroundColor(color.getIndex());
                        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
                        colorStyles.put(color, style);
                    }
                    for (int i = 0; i < headers.length; i++) {
                        row.getCell(i).setCellStyle(style);
                    }
                }
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate Excel export", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public StudentProfileResponseDto getStudentById(Integer studentId) {
        StudentProfileResponseDto profile = studentRepository.getStudentProfileById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        if (profile.getCourseId() == null && profile.getClassId() != null) {
            classRepository.findById(profile.getClassId())
                    .ifPresent(classMaster -> profile.setCourseId(classMaster.getCourseId()));
        }
        return profile;
    }

    @Override
    public StudentProfileResponseDto getStudentProfileByUserId(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        if (!"STUDENT".equals(user.getRole())) {
            throw new IllegalArgumentException("User is not a student");
        }
        if (user.getStudentId() == null) {
            throw new ResourceNotFoundException("Student profile not linked to user: " + userId);
        }
        return getStudentById(user.getStudentId());
    }

    @Override
    @Transactional(readOnly = true)
    public StudentSiblingSearchResponseDto getStudentByAadhaarNumber(String aadhaarNumber) {
        Student student = studentRepository.findByAadhaarNumberAndIsDeletedFalse(aadhaarNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with aadhaarNumber: " + aadhaarNumber));

        StudentAcademic academic = resolveStudentAcademic(student.getStudentId()).orElse(null);
        SchoolMaster school = academic != null ? schoolRepository.findById(academic.getSchoolId()).orElse(null) : null;
        String className = academic != null
                ? classRepository.findById(academic.getClassId()).map(ClassMaster::getClassName).orElse(null)
                : null;

        return StudentSiblingSearchResponseDto.builder()
                .studentId(student.getStudentId())
                .studentName(buildStudentName(student))
                .classId(academic != null ? academic.getClassId() : null)
                .className(className)
                .schoolName(school != null ? school.getSchName() : null)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentSiblingInfoDto> getSiblingsByStudentId(Integer studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        Set<Integer> siblingIds = parseStudentIds(student.getSiblingId());
        if (siblingIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<Student> siblings = studentRepository.findByStudentIdInAndIsDeletedFalse(siblingIds);
        return siblings.stream()
                .map((Student s) -> {
                    StudentAcademic academic = resolveStudentAcademic(s.getStudentId()).orElse(null);
                    SchoolMaster school = academic != null ? schoolRepository.findById(academic.getSchoolId()).orElse(null) : null;
                    String className = academic != null
                            ? classRepository.findById(academic.getClassId()).map(ClassMaster::getClassName).orElse(null)
                            : null;
                    return StudentSiblingInfoDto.builder()
                            .studentId(s.getStudentId())
                            .fullName(buildStudentName(s))
                            .classId(academic != null ? academic.getClassId() : null)
                            .className(className)
                            .schoolName(school != null ? school.getSchName() : null)
                            .build();
                })
                .toList();
    }

    @Override
    @Transactional
    public StudentResponseDto updateStudent(Integer studentId, StudentRequestDto requestDto) {
        Student existingStudent = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        if (Boolean.TRUE.equals(existingStudent.getIsDeleted())) {
            throw new ResourceNotFoundException("Student not found with id: " + studentId);
        }

        String normalizedEmail = requestDto.getEmailId().trim().toLowerCase();
        if (studentRepository.existsByEmailIdIgnoreCaseAndStudentIdNot(normalizedEmail, studentId)) {
            throw new DuplicateResourceException("emailId already exists");
        }

        if (studentRepository.existsByAadhaarNumberAndStudentIdNot(requestDto.getAadhaarNumber(), studentId)) {
            throw new DuplicateResourceException("aadhaarNumber already exists");
        }

        Set<Integer> existingSiblingIds = parseStudentIds(existingStudent.getSiblingId());
        Integer guardianId = existingStudent.getGuardian() != null ? existingStudent.getGuardian().getGuardianId() : null;
        StudentAcademic existingAcademic = resolveStudentAcademic(studentId).orElse(null);

        StudentFamily family = persistStudentFamily(requestDto, existingStudent.getFamily());
        guardianId = resolveGuardianId(requestDto, guardianId);

        String imageUrl = requestDto.getImageUrl() != null && !requestDto.getImageUrl().isBlank()
                ? requestDto.getImageUrl()
                : existingStudent.getImageUrl();

        studentRepository.createOrUpdateStudentV2(
                existingStudent.getStudentId(),
                requestDto.getFirstName(),
                requestDto.getLastName(),
                normalizedEmail,
                requestDto.getDob(),
                requestDto.getGender(),
                requestDto.getAadhaarNumber(),
                requestDto.getCasteId(),
                requestDto.getReligion(),
                requestDto.getBloodGroup(),
                family.getFamilyId(),
                guardianId,
                Boolean.TRUE.equals(requestDto.getHasSibling()) ? requestDto.getSiblingIds() : null,
                requestDto.getOrphanStatus(),
                imageUrl,
                requestDto.getCreatedBy()
        );

        StudentAcademicRequestDto academicRequest = resolveAcademicRequest(requestDto, existingAcademic);
        Student updatedStudent = findStudentByAadhaar(requestDto.getAadhaarNumber());
        upsertStudentAcademic(updatedStudent.getStudentId(), existingAcademic, academicRequest, requestDto);
        syncSiblingGroup(updatedStudent.getStudentId(), existingSiblingIds, requestDto.getSiblingIds(), Boolean.TRUE.equals(requestDto.getHasSibling()));

        return mapToResponseDto(updatedStudent);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Integer> getAllStudentIds(
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
    ) {
        return studentRepository.getAllStudentsWithPagination(
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
                        academicYearId,
                        parentType,
                        parentOccupation,
                        "student_id",
                        "ASC"
                )
                .stream()
                .map(StudentListResponseDto::getStudentId)
                .toList();
    }

    @Override
    @Transactional
    public void deleteStudent(Integer studentId) {
        Student existingStudent = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        if (Boolean.TRUE.equals(existingStudent.getIsDeleted())) {
            throw new ResourceNotFoundException("Student not found with id: " + studentId);
        }

        studentRepository.deleteStudent(new Integer[]{studentId}, existingStudent.getCreatedBy());
    }

    @Override
    @Transactional(readOnly = true)
    public StudentAcademicResponseDto getStudentAcademicById(Integer studentId) {
        StudentAcademic academic = resolveStudentAcademic(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student academic not found with student id: " + studentId));
        return mapAcademicResponse(studentId, academic);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentListResponseDto> searchStudents(
            String studentName,
            String schoolName,
            String districtName,
            String stateName,
            String gender,
            String classId,
            String orphanStatus,
            boolean sponsored
    ) {
        return searchStudentsBySponsorName(
                null,
                studentName,
                schoolName,
                districtName,
                stateName,
                gender,
                classId,
                orphanStatus,
                sponsored
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentListResponseDto> searchStudentsBySponsorName(
            String sponsorName,
            String studentName,
            String schoolName,
            String districtName,
            String stateName,
            String gender,
            String classId,
            String orphanStatus,
            boolean sponsored
    ) {
        List<StudentListResponseDto> students = studentRepository.getAllStudentsWithPagination(
                studentName,
                1,
                Integer.MAX_VALUE,
                gender,
                classId,
                orphanStatus,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                "student_id",
                "ASC"
        );

        String sponsorNeedle = StringUtils.hasText(sponsorName)
                ? sponsorName.trim().toLowerCase(Locale.ROOT)
                : null;

        return students.stream()
                .filter(student -> !StringUtils.hasText(schoolName)
                        || (student.getSchName() != null && student.getSchName().toLowerCase(Locale.ROOT).contains(schoolName.trim().toLowerCase(Locale.ROOT))))
                .filter(student -> !StringUtils.hasText(districtName)
                        || (student.getDistName() != null && student.getDistName().toLowerCase(Locale.ROOT).contains(districtName.trim().toLowerCase(Locale.ROOT))))
                .filter(student -> !StringUtils.hasText(stateName)
                        || (student.getStName() != null && student.getStName().toLowerCase(Locale.ROOT).contains(stateName.trim().toLowerCase(Locale.ROOT))))
                .filter(student -> !StringUtils.hasText(sponsorNeedle)
                        || (student.getSponsorName() != null && student.getSponsorName().toLowerCase(Locale.ROOT).contains(sponsorNeedle)))
                .filter(student -> !sponsored || StringUtils.hasText(student.getSponsorName()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.Optional<StudentDetailsResponseDto> getStudentDetailsByName(String studentName) {
        if (!StringUtils.hasText(studentName)) {
            return java.util.Optional.empty();
        }

        List<StudentListResponseDto> matches = studentRepository.getAllStudentsWithPagination(
                studentName,
                1,
                1,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                "student_id",
                "ASC"
        );

        if (matches.isEmpty()) {
            return java.util.Optional.empty();
        }

        StudentProfileResponseDto profile = getStudentById(matches.get(0).getStudentId());
        if (profile == null) {
            return java.util.Optional.empty();
        }

        return java.util.Optional.of(
                StudentDetailsResponseDto.builder()
                        .studentId(profile.getStudentId())
                        .studentName(profile.getStudentName())
                        .gender(profile.getGender())
                        .dob(profile.getDob())
                        .className(profile.getClassName())
                        .schoolName(profile.getSchoolName())
                        .guardianName(profile.getGuardianName())
                        .phone(profile.getGuardianPhone() != null ? profile.getGuardianPhone() : profile.getPhoneNumber())
                        .email(profile.getEmailId())
                        .bloodGroup(profile.getBloodGroup())
                        .religion(profile.getReligion())
                        .caste(profile.getCasteName())
                        .orphanStatus(profile.getOrphanStatus())
                        .sponsor(null)
                        .build()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public long countStudentsByOrphanStatus(String orphanStatus) {
        if (orphanStatus == null || orphanStatus.isBlank()) {
            return 0L;
        }
        return studentRepository.countByOrphanStatusAndIsDeletedFalse(orphanStatus);
    }

    @Override
    @Transactional(readOnly = true)
    public long countStudentsByGender(String gender) {
        if (!StringUtils.hasText(gender)) {
            return 0L;
        }
        return studentRepository.countByGenderAndIsDeletedFalse(gender.trim());
    }

    @Override
    @Transactional(readOnly = true)
    public long countVillages() {
        return villageRepository.countByIsDeletedFalse();
    }

    @Override
    @Transactional(readOnly = true)
    public long countMandals() {
        return mandalRepository.countByIsDeletedFalse();
    }

    @Override
    @Transactional(readOnly = true)
    public long countDistricts() {
        return districtRepository.countByIsDeletedFalse();
    }

    @Override
    @Transactional(readOnly = true)
    public long countStates() {
        return stateRepository.countByIsDeletedFalse();
    }

    private StudentResponseDto mapToResponseDto(Student student) {
        Guardian guardian = student.getGuardian();
        StudentAcademic academic = resolveStudentAcademic(student.getStudentId()).orElse(null);
        AcademicYear academicYear = resolveAcademicYear(academic != null ? academic.getAcademicYearId() : null);
        SchoolMaster school = academic != null && academic.getSchoolId() != null
                ? schoolRepository.findById(academic.getSchoolId()).orElse(null)
                : null;
        ClassMaster classMaster = academic != null && academic.getClassId() != null
                ? classRepository.findById(academic.getClassId()).orElse(null)
                : null;

        return StudentResponseDto.builder()
                .studentId(student.getStudentId())
                .firstName(student.getFirstName())
                .lastName(student.getLastName())
                .emailId(student.getEmailId())
                .dob(student.getDob())
                .gender(resolveGenderLabel(student.getGender()))
                .aadhaarNumber(student.getAadhaarNumber())
                .casteId(student.getCasteId())
                .religion(resolveReligionLabel(student.getReligion()))
                .bloodGroup(student.getBloodGroup())
                .studentAcademicId(academic != null ? academic.getStudentAcademicId() : null)
                .schId(academic != null ? academic.getSchoolId() : null)
                .classId(academic != null ? academic.getClassId() : null)
                .academicYearId(academic != null ? academic.getAcademicYearId() : null)
                .academicYearName(academicYear != null ? academicYear.getAcademicYearName() : null)
                .schoolId(academic != null ? academic.getSchoolId() : null)
                .schoolName(school != null ? school.getSchName() : null)
                .rollNumber(academic != null ? academic.getRollNumber() : null)
                .admissionType(academic != null ? academic.getAdmissionType() : null)
                .status(academic != null ? academic.getStatus() : null)
                .remarks(academic != null ? academic.getRemarks() : null)
                .academicIsActive(academic != null ? academic.getIsActive() : null)
                .academicIsDeleted(academic != null ? academic.getIsDeleted() : null)
                .academicCreatedAt(academic != null ? academic.getCreatedAt() : null)
                .academicCreatedBy(academic != null ? academic.getCreatedBy() : null)
                .academicUpdatedAt(academic != null ? academic.getUpdatedAt() : null)
                .academicUpdatedBy(academic != null ? academic.getUpdatedBy() : null)
                .familyId(student.getFamily() != null ? student.getFamily().getFamilyId() : null)
                .fatherName(student.getFamily() != null ? student.getFamily().getFatherName() : null)
                .fatherOccupation(student.getFamily() != null ? student.getFamily().getFatherOccupation() : null)
                .fatherStatus(resolveParentStatusLabel(student.getFamily() != null ? student.getFamily().getFatherStatus() : null))
                .motherName(student.getFamily() != null ? student.getFamily().getMotherName() : null)
                .motherOccupation(student.getFamily() != null ? student.getFamily().getMotherOccupation() : null)
                .motherStatus(resolveParentStatusLabel(student.getFamily() != null ? student.getFamily().getMotherStatus() : null))
                .siblingId(student.getSiblingId())
                .guardianId(guardian != null ? guardian.getGuardianId() : null)
                .guardianName(buildGuardianName(guardian))
                .guardianPhone(guardian != null ? guardian.getPhoneNumber() : null)
                .relationshipName(resolveRelationshipName(guardian != null ? guardian.getRelationshipId() : null))
                .orphanStatus(resolveOrphanStatusLabel(student.getOrphanStatus()))
                .imageUrl(student.getImageUrl())
                .isDeleted(student.getIsDeleted())
                .createdAt(student.getCreatedAt())
                .createdBy(student.getCreatedBy())
                .modifiedAt(student.getModifiedAt())
                .modifiedBy(student.getModifiedBy())
                .academicDetails(mapAcademicResponse(student.getStudentId(), academic))
                .guardian(mapGuardianDto(guardian))
                .build();
    }

    private String buildStudentName(Student student) {
         if (student == null) {
            return null;
        }
        return (student.getFirstName() != null ? student.getFirstName() : "")
                + (student.getLastName() != null && !student.getLastName().isBlank() ? " " + student.getLastName() : "");
    }

    private StudentResponseDto.GuardianDto mapGuardianDto(Guardian guardian) {
        if (guardian == null) {
            return null;
        }

        return StudentResponseDto.GuardianDto.builder()
                .guardianId(guardian.getGuardianId())
                .firstName(guardian.getFirstName())
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

    private StudentAcademicResponseDto mapAcademicResponse(Integer studentId, StudentAcademic academic) {
        if (academic == null) {
            return null;
        }

        AcademicYear academicYear = resolveAcademicYear(academic.getAcademicYearId());
        SchoolMaster school = academic.getSchoolId() != null ? schoolRepository.findById(academic.getSchoolId()).orElse(null) : null;
        ClassMaster classMaster = academic.getClassId() != null ? classRepository.findById(academic.getClassId()).orElse(null) : null;

        return StudentAcademicResponseDto.builder()
                .studentAcademicId(academic.getStudentAcademicId())
                .studentId(studentId)
                .academicYearId(academic.getAcademicYearId())
                .academicYearName(academicYear != null ? academicYear.getAcademicYearName() : null)
                .schoolId(academic.getSchoolId())
                .schoolName(school != null ? school.getSchName() : null)
                .courseId(classMaster != null ? classMaster.getCourseId() : null)
                .classId(academic.getClassId())
                .className(classMaster != null ? classMaster.getClassName() : null)
                .rollNumber(academic.getRollNumber())
                .admissionType(academic.getAdmissionType())
                .status(academic.getStatus())
                .remarks(academic.getRemarks())
                .isActive(academic.getIsActive())
                .isDeleted(academic.getIsDeleted())
                .createdAt(academic.getCreatedAt())
                .createdBy(academic.getCreatedBy())
                .updatedAt(academic.getUpdatedAt())
                .updatedBy(academic.getUpdatedBy())
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
                .studentAcademicId(student.getStudentAcademicId())
                .schId(student.getSchId())
                .schoolId(student.getSchoolId())
                .classId(student.getClassId())
                .academicYearId(student.getAcademicYearId())
                .academicYearName(student.getAcademicYearName())
                .rollNumber(student.getRollNumber())
                .admissionType(student.getAdmissionType())
                .status(student.getStatus())
                .annualResult(student.getAnnualResult())
                .remarks(student.getRemarks())
                .academicIsActive(student.getAcademicIsActive())
                .academicIsDeleted(student.getAcademicIsDeleted())
                .academicCreatedAt(student.getAcademicCreatedAt())
                .academicCreatedBy(student.getAcademicCreatedBy())
                .academicUpdatedAt(student.getAcademicUpdatedAt())
                .academicUpdatedBy(student.getAcademicUpdatedBy())
                .familyId(student.getFamilyId())
                .fatherName(student.getFatherName())
                .fatherOccupation(student.getFatherOccupation())
                .fatherStatus(resolveParentStatusLabel(student.getFatherStatus()))
                .motherName(student.getMotherName())
                .motherOccupation(student.getMotherOccupation())
                .motherStatus(resolveParentStatusLabel(student.getMotherStatus()))
                .schAddress(student.getSchAddress())
                .schName(student.getSchName())
                .className(student.getClassName())
                .guardianName(student.getGuardianName())
                .guardianId(student.getGuardianId())
                .guardianPhone(student.getGuardianPhone())
                .guardianRelationName(student.getGuardianRelationName())
                .relationshipName(student.getRelationshipName())
                .vilName(student.getVilName())
                .mndlName(student.getMndlName())
                .distName(student.getDistName())
                .stName(student.getStName())
                .siblingId(student.getSiblingId())
                .orphanStatus(resolveOrphanStatusLabel(student.getOrphanStatus()))
                .sponsorId(student.getSponsorId())
                .sponsorName(student.getSponsorName())
                .totalCount(student.getTotalCount())
                .boysCount(student.getBoysCount())
                .girlsCount(student.getGirlsCount())
                .sponsoredCount(student.getSponsoredCount())
                .orphansCount(student.getOrphansCount())
                .imageUrl(student.getImageUrl())
                .createdAt(student.getCreatedAt())
                .createdBy(student.getCreatedBy())
                .modifiedAt(student.getModifiedAt())
                .modifiedBy(student.getModifiedBy())
                .academicDetails(student.getAcademicDetails())
                .build();
    }

    private void enrichAnnualResults(List<StudentListResponseDto> students) {
        List<Integer> academicIds = students.stream()
                .map(StudentListResponseDto::getStudentAcademicId)
                .filter(id -> id != null)
                .distinct()
                .toList();
        if (academicIds.isEmpty()) {
            return;
        }
        Map<Integer, List<StudentMarks>> marksByStudent = studentMarksRepository
                .findByStudentAcademicIdInAndIsDeletedFalse(academicIds)
                .stream()
                .collect(Collectors.groupingBy(StudentMarks::getStudentAcademicId));
        for (StudentListResponseDto student : students) {
            if (student.getStudentAcademicId() == null) {
                continue;
            }
            List<StudentMarks> rows = marksByStudent.getOrDefault(student.getStudentAcademicId(), List.of());
            if (rows.isEmpty()) {
                continue;
            }
            boolean allPresent = rows.stream().allMatch(r -> r.getResult() != null);
            if (allPresent) {
                boolean anyFail = rows.stream().anyMatch(r -> "FAIL".equals(r.getResult()));
                student.setAnnualResult(anyFail ? "FAIL" : "PASS");
            }
        }
    }

    private void upsertStudentAcademic(
            Integer studentId,
            StudentAcademic existingAcademic,
            StudentAcademicRequestDto academicRequest,
            StudentRequestDto requestDto
    ) {
        Integer studentAcademicId = academicRequest.getStudentAcademicId();
        if (studentAcademicId == null && existingAcademic != null) {
            studentAcademicId = existingAcademic.getStudentAcademicId();
        }

        Integer academicYearId = resolveAcademicYearId(
                academicRequest.getAcademicYearId(),
                existingAcademic != null ? existingAcademic.getAcademicYearId() : null
        );

        Integer schoolId = academicRequest.getSchoolId() != null
                ? academicRequest.getSchoolId()
                : (existingAcademic != null ? existingAcademic.getSchoolId() : null);
        Integer classId = academicRequest.getClassId() != null
                ? academicRequest.getClassId()
                : (existingAcademic != null ? existingAcademic.getClassId() : null);

        if (schoolId == null || classId == null) {
            throw new IllegalArgumentException("School and class are required for student academic details");
        }

        studentAcademicRepository.createOrUpdateStudentAcademic(
                studentAcademicId,
                studentId,
                academicYearId,
                schoolId,
                classId,
                resolveText(academicRequest.getRollNumber(), existingAcademic != null ? existingAcademic.getRollNumber() : null),
                resolveText(academicRequest.getAdmissionType(), existingAcademic != null ? existingAcademic.getAdmissionType() : null),
                resolveText(academicRequest.getStatus(), existingAcademic != null ? existingAcademic.getStatus() : null),
                resolveText(academicRequest.getRemarks(), existingAcademic != null ? existingAcademic.getRemarks() : null),
                academicRequest.getIsActive() != null ? academicRequest.getIsActive() : (existingAcademic != null ? existingAcademic.getIsActive() : Boolean.TRUE),
                academicRequest.getCreatedBy() != null ? academicRequest.getCreatedBy() : requestDto.getCreatedBy()
        );
    }

    private StudentAcademicRequestDto resolveAcademicRequest(StudentRequestDto requestDto, StudentAcademic existingAcademic) {
        StudentAcademicRequestDto academic = requestDto.getAcademicDetails();
        Integer schoolId = academic != null && academic.getSchoolId() != null ? academic.getSchoolId() : requestDto.getSchId();
        Integer classId = academic != null && academic.getClassId() != null ? academic.getClassId() : requestDto.getClassId();
        Integer academicYearId = academic != null && academic.getAcademicYearId() != null ? academic.getAcademicYearId() : requestDto.getAcademicYearId();

        return StudentAcademicRequestDto.builder()
                .studentAcademicId(academic != null ? academic.getStudentAcademicId() : null)
                .schoolId(schoolId != null ? schoolId : (existingAcademic != null ? existingAcademic.getSchoolId() : null))
                .classId(classId != null ? classId : (existingAcademic != null ? existingAcademic.getClassId() : null))
                .academicYearId(academicYearId != null ? academicYearId : (existingAcademic != null ? existingAcademic.getAcademicYearId() : null))
                .rollNumber(academic != null && academic.getRollNumber() != null ? academic.getRollNumber() : null)
                .admissionType(resolveAdmissionTypeCode(academic != null ? academic.getAdmissionType() : null))
                .status(resolveAcademicStatusCode(academic != null ? academic.getStatus() : null))
                .remarks(academic != null && academic.getRemarks() != null ? academic.getRemarks() : null)
                .isActive(academic != null ? academic.getIsActive() : null)
                .isDeleted(academic != null ? academic.getIsDeleted() : null)
                .createdBy(academic != null ? academic.getCreatedBy() : null)
                .updatedBy(academic != null ? academic.getUpdatedBy() : null)
                .build();
    }

    private Student findStudentByAadhaar(String aadhaarNumber) {
        return studentRepository.findByAadhaarNumberAndIsDeletedFalse(aadhaarNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found after procedure call for aadhaarNumber: " + aadhaarNumber));
    }

    private Optional<StudentAcademic> resolveStudentAcademic(Integer studentId) {
        if (studentId == null) {
            return Optional.empty();
        }

        Optional<StudentAcademic> academic = studentRepository.getStudentAcademicById(studentId);
        if (academic.isPresent()) {
            return academic;
        }
        return studentAcademicRepository.findTopByStudentIdAndIsDeletedFalseOrderByStudentAcademicIdDesc(studentId);
    }

    private Map<Integer, IndexedColors> computeSiblingGroupColors(
            List<StudentListResponseDto> students,
            Set<Integer> exportedIds
    ) {
        Set<Integer> allReferencedSiblingIds = new HashSet<>();
        for (StudentListResponseDto student : students) {
            String siblingId = student.getSiblingId();
            if (siblingId != null && !siblingId.isBlank()) {
                allReferencedSiblingIds.addAll(parseStudentIds(siblingId));
            }
        }

        Set<Integer> activeReferencedSiblingIds;
        if (allReferencedSiblingIds.isEmpty()) {
            activeReferencedSiblingIds = Collections.emptySet();
        } else {
            activeReferencedSiblingIds = studentRepository.findByStudentIdInAndIsDeletedFalse(allReferencedSiblingIds)
                    .stream()
                    .map(Student::getStudentId)
                    .collect(Collectors.toSet());
        }

        Map<Integer, List<Integer>> completeGroups = new LinkedHashMap<>();

        for (StudentListResponseDto student : students) {
            String siblingId = student.getSiblingId();
            if (siblingId == null || siblingId.isBlank()) continue;

            Set<Integer> parsedIds = parseStudentIds(siblingId);
            if (parsedIds.isEmpty()) continue;

            Set<Integer> activeSiblingIds = parsedIds.stream()
                    .filter(activeReferencedSiblingIds::contains)
                    .collect(Collectors.toSet());

            if (activeSiblingIds.isEmpty()) continue;

            Set<Integer> presentSiblingIds = activeSiblingIds.stream()
                    .filter(exportedIds::contains)
                    .collect(Collectors.toSet());

            if (presentSiblingIds.isEmpty()) continue;

            Set<Integer> fullGroup = new HashSet<>(presentSiblingIds);
            fullGroup.add(student.getStudentId());

            if (fullGroup.size() < 2) continue;
            Integer groupKey = Collections.min(fullGroup);

            completeGroups.computeIfAbsent(groupKey, k -> new ArrayList<>()).add(student.getStudentId());
        }

        IndexedColors[] palette = {
                IndexedColors.YELLOW,
                IndexedColors.BRIGHT_GREEN,
                IndexedColors.LIGHT_BLUE,
                IndexedColors.ORANGE,
                IndexedColors.ROSE,
                IndexedColors.LAVENDER,
                IndexedColors.TEAL,
                IndexedColors.CORAL
        };

        Map<Integer, IndexedColors> studentColorMap = new HashMap<>();
        int colorIndex = 0;
        for (List<Integer> groupMembers : completeGroups.values()) {
            IndexedColors color = palette[colorIndex % palette.length];
            for (Integer studentId : groupMembers) {
                studentColorMap.put(studentId, color);
            }
            colorIndex++;
        }

        return studentColorMap;
    }

    private StudentFamily persistStudentFamily(StudentRequestDto requestDto, StudentFamily fallbackFamily) {
        Integer familyId = requestDto.getFamilyId() != null
                ? requestDto.getFamilyId()
                : (fallbackFamily != null ? fallbackFamily.getFamilyId() : null);

        if (familyId != null && !hasFamilyPayload(requestDto)) {
            return fallbackFamily != null && familyId.equals(fallbackFamily.getFamilyId())
                    ? fallbackFamily
                    : studentFamilyService.getStudentFamilyById(familyId);
        }

        return studentFamilyService.createOrUpdateStudentFamily(
                familyId,
                resolveText(requestDto.getFatherName(), fallbackFamily != null ? fallbackFamily.getFatherName() : null),
                resolveText(requestDto.getFatherOccupation(), fallbackFamily != null ? fallbackFamily.getFatherOccupation() : null),
                resolveParentStatusValue(requestDto.getFatherStatus(), fallbackFamily != null ? fallbackFamily.getFatherStatus() : null),
                resolveText(requestDto.getMotherName(), fallbackFamily != null ? fallbackFamily.getMotherName() : null),
                resolveText(requestDto.getMotherOccupation(), fallbackFamily != null ? fallbackFamily.getMotherOccupation() : null),
                resolveParentStatusValue(requestDto.getMotherStatus(), fallbackFamily != null ? fallbackFamily.getMotherStatus() : null),
                requestDto.getCreatedBy()
        );
    }

    private Integer resolveGuardianId(StudentRequestDto requestDto, Integer fallbackGuardianId) {
        if (requestDto.getGuardianId() != null && !hasGuardianPayload(requestDto)) {
            return requestDto.getGuardianId();
        }

        if (requestDto.getGuardian() == null) {
            if (fallbackGuardianId != null) {
                return fallbackGuardianId;
            }
            if (requestDto.getGuardianId() != null) {
                return requestDto.getGuardianId();
            }
            throw new ResourceNotFoundException("Guardian information is required");
        }

        guardianRepository.createOrUpdateGuardian(
                requestDto.getGuardianId(),
                requestDto.getGuardian().getFirstName(),
                requestDto.getGuardian().getLastName(),
                requestDto.getGuardian().getPhoneNumber(),
                requestDto.getGuardian().getRelationshipId(),
                requestDto.getGuardian().getOcc(),
                requestDto.getGuardian().getAddr()
        );

        if (requestDto.getGuardianId() != null) {
            return requestDto.getGuardianId();
        }

        return guardianRepository.findTopByFirstNameAndLastNameAndPhoneNumberOrderByGuardianIdDesc(
                        requestDto.getGuardian().getFirstName(),
                        requestDto.getGuardian().getLastName(),
                        requestDto.getGuardian().getPhoneNumber()
                )
                .map(Guardian::getGuardianId)
                .orElseThrow(() -> new ResourceNotFoundException("Guardian not found after procedure call"));
    }

    private boolean hasFamilyPayload(StudentRequestDto requestDto) {
        return hasText(requestDto.getFatherName())
                || hasText(requestDto.getFatherOccupation())
                || hasText(requestDto.getFatherStatus())
                || hasText(requestDto.getMotherName())
                || hasText(requestDto.getMotherOccupation())
                || hasText(requestDto.getMotherStatus());
    }

    private boolean hasGuardianPayload(StudentRequestDto requestDto) {
        if (requestDto.getGuardian() == null) {
            return false;
        }
        StudentRequestDto.GuardianRequestDto guardian = requestDto.getGuardian();
        return hasText(guardian.getFirstName())
                || hasText(guardian.getLastName())
                || hasText(guardian.getPhoneNumber())
                || guardian.getRelationshipId() != null
                || hasText(guardian.getOcc())
                || hasText(guardian.getAddr());
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String resolveGenderLabel(String value) {
        if (value == null) {
            return null;
        }
        String label = Gender.getLabelByValue(value);
        return label != null ? label : value;
    }

    private String resolveParentStatusValue(String requestedValue, String fallbackValue) {
        String candidate = resolveText(requestedValue, fallbackValue);
        if (candidate == null) {
            return ParentStatus.UNKNOWN.getValue();
        }

        ParentStatus byLabel = ParentStatus.fromLabel(candidate);
        if (byLabel != null) {
            return byLabel.getValue();
        }

        try {
            return ParentStatus.fromValue(candidate).getValue();
        } catch (IllegalArgumentException ex) {
            return ParentStatus.UNKNOWN.getValue();
        }
    }

    private String resolveParentStatusLabel(String value) {
        if (value == null) {
            return null;
        }
        String label = ParentStatus.getLabelByValue(value);
        return label != null ? label : value;
    }

    private String resolveReligionLabel(String value) {
        if (value == null) {
            return null;
        }
        String label = Religion.getLabelByValue(value);
        return label != null ? label : value;
    }

    private String resolveAdmissionTypeCode(String input) {
        if (input == null || input.isBlank()) return null;
        AdmissionType resolved = AdmissionType.fromLabel(input);
        if (resolved != null) return resolved.getValue();
        try {
            return AdmissionType.fromValue(input).getValue();
        } catch (IllegalArgumentException e) {
            return input.trim();
        }
    }

    private String resolveAcademicStatusCode(String input) {
        if (input == null || input.isBlank()) return null;
        StudentAcademicStatus resolved = StudentAcademicStatus.fromLabel(input);
        if (resolved != null) return resolved.getValue();
        try {
            return StudentAcademicStatus.fromValue(input).getValue();
        } catch (IllegalArgumentException e) {
            return input.trim();
        }
    }

    private String resolveText(String requestedValue, String fallbackValue) {
        if (requestedValue != null && !requestedValue.isBlank()) {
            return requestedValue.trim();
        }
        if (fallbackValue != null && !fallbackValue.isBlank()) {
            return fallbackValue.trim();
        }
        return null;
    }

    private String buildGuardianName(Guardian guardian) {
        if (guardian == null) {
            return null;
        }
        return (guardian.getFirstName() != null ? guardian.getFirstName() : "")
                + (guardian.getLastName() != null && !guardian.getLastName().isBlank() ? " " + guardian.getLastName() : "");
    }

    private String resolveRelationshipName(Integer relationshipId) {
        if (relationshipId == null) {
            return null;
        }
        return relationshipRepository.findById(relationshipId)
                .map(com.saho.foundation.entity.RelationshipMaster::getRelationshipName)
                .orElse(null);
    }

    private String resolveOrphanStatusLabel(String value) {
        if (value == null) {
            return null;
        }
        String label = OrphanStatus.getLabelByValue(value);
        return label != null ? label : value;
    }

    private Integer ageFromDob(LocalDate dob) {
        if (dob == null) {
            return null;
        }
        java.time.Period period = java.time.Period.between(dob, LocalDate.now());
        return period.getYears();
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

    private void syncSiblingGroup(Integer currentStudentId, Set<Integer> oldSiblingIds, String newSiblingIdsCsv, boolean hasSibling) {
        if (currentStudentId == null) return;

        if (!hasSibling) {
            for (Integer siblingId : oldSiblingIds) {
                studentRepository.findById(siblingId).ifPresent(sibling -> {
                    if (!Boolean.TRUE.equals(sibling.getIsDeleted())) {
                        Set<Integer> currentSiblings = parseStudentIds(sibling.getSiblingId());
                        currentSiblings.remove(currentStudentId);
                        sibling.setSiblingId(joinStudentIds(currentSiblings));
                        studentRepository.save(sibling);
                    }
                });
            }
            studentRepository.findById(currentStudentId).ifPresent(s -> {
                s.setSiblingId(null);
                studentRepository.save(s);
            });
            return;
        }

        Set<Integer> newSiblingIds = parseStudentIds(newSiblingIdsCsv);
        if (newSiblingIds.isEmpty()) return;

        Set<Integer> removedFromGroup = new LinkedHashSet<>(oldSiblingIds);
        removedFromGroup.removeAll(newSiblingIds);

        Set<Integer> groupIds = new LinkedHashSet<>();
        groupIds.add(currentStudentId);
        groupIds.addAll(newSiblingIds);

        for (Integer siblingId : newSiblingIds) {
            Optional<Student> optSibling = studentRepository.findById(siblingId);
            if (optSibling.isPresent() && !Boolean.TRUE.equals(optSibling.get().getIsDeleted())) {
                Set<Integer> theirSiblings = parseStudentIds(optSibling.get().getSiblingId());
                theirSiblings.removeAll(removedFromGroup);
                groupIds.addAll(theirSiblings);
            }
        }

        List<Student> allCandidates = studentRepository.findAllById(groupIds);
        Set<Integer> validActiveIds = allCandidates.stream()
                .filter(s -> !Boolean.TRUE.equals(s.getIsDeleted()))
                .map(Student::getStudentId)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        Map<Integer, Student> activeStudentMap = allCandidates.stream()
                .filter(s -> validActiveIds.contains(s.getStudentId()))
                .collect(Collectors.toMap(Student::getStudentId, Function.identity()));

        for (Integer id : validActiveIds) {
            Student student = activeStudentMap.get(id);
            Set<Integer> otherIds = new LinkedHashSet<>(validActiveIds);
            otherIds.remove(id);
            student.setSiblingId(joinStudentIds(otherIds));
            studentRepository.save(student);
        }

        for (Integer removedId : removedFromGroup) {
            studentRepository.findById(removedId).ifPresent(s -> {
                s.setSiblingId(null);
                studentRepository.save(s);
            });
        }
    }

    private AcademicYear resolveAcademicYear(Integer academicYearId) {
        if (academicYearId == null) {
            return null;
        }
        return academicYearRepository.findByAcademicYearIdAndIsDeletedFalse(academicYearId).orElse(null);
    }

    private Integer resolveAcademicYearId(Integer requestedAcademicYearId, Integer fallbackAcademicYearId) {
        if (requestedAcademicYearId != null) {
            return academicYearRepository.findByAcademicYearIdAndIsDeletedFalse(requestedAcademicYearId)
                    .map(AcademicYear::getAcademicYearId)
                    .orElseThrow(() -> new ResourceNotFoundException("Academic year not found with id: " + requestedAcademicYearId));
        }

        if (fallbackAcademicYearId != null) {
            return fallbackAcademicYearId;
        }

        return academicYearRepository.findByIsCurrentTrueAndIsActiveTrueAndIsDeletedFalse()
                .map(AcademicYear::getAcademicYearId)
                .orElseThrow(() -> new ResourceNotFoundException("Current academic year not found"));
    }
}
