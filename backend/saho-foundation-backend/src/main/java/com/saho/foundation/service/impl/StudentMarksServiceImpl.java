package com.saho.foundation.service.impl;

import com.saho.foundation.dto.ClassMarksRequestDto;
import com.saho.foundation.dto.ClassMarksSheetResponseDto;
import com.saho.foundation.dto.ClassStudentDto;
import com.saho.foundation.dto.ClassStudentResponseDto;
import com.saho.foundation.dto.CourseSubjectMarksDto;
import com.saho.foundation.dto.StudentClassMarksEntryDto;
import com.saho.foundation.dto.StudentMarksEntryDto;
import com.saho.foundation.dto.StudentMarksRequestDto;
import com.saho.foundation.dto.StudentMarksResponseDto;
import com.saho.foundation.dto.StudentOutcomeSummaryDto;
import com.saho.foundation.dto.SubjectMarksResponseDto;
import com.saho.foundation.entity.AcademicYear;
import com.saho.foundation.entity.ClassMaster;
import com.saho.foundation.entity.CourseSubject;
import com.saho.foundation.entity.SchoolMaster;
import com.saho.foundation.entity.Student;
import com.saho.foundation.entity.StudentAcademic;
import com.saho.foundation.entity.StudentMarks;
import com.saho.foundation.entity.SubjectMaster;
import com.saho.foundation.enums.AdmissionType;
import com.saho.foundation.enums.StudentAcademicStatus;
import com.saho.foundation.exception.ResourceNotFoundException;
import com.saho.foundation.repository.AcademicYearRepository;
import com.saho.foundation.repository.ClassRepository;
import com.saho.foundation.repository.CourseSubjectRepository;
import com.saho.foundation.repository.SchoolRepository;
import com.saho.foundation.repository.StudentAcademicRepository;
import com.saho.foundation.repository.StudentMarksRepository;
import com.saho.foundation.repository.StudentRepository;
import com.saho.foundation.repository.SubjectRepository;
import com.saho.foundation.security.SecurityUtil;
import com.saho.foundation.service.iservices.StudentMarksService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentMarksServiceImpl implements StudentMarksService {

    private static final BigDecimal MAX_MARKS = new BigDecimal("100");
    private static final BigDecimal PASS_MARKS = new BigDecimal("35");
    private static final String RESULT_PASS = "PASS";
    private static final String RESULT_FAIL = "FAIL";
    private static final String OUTCOME_AUTO = "AUTO";
    private static final String OUTCOME_TRANSFERRED = "TRANSFERRED";
    private static final String OUTCOME_DROPPED = "DROPPED";
    private static final Set<String> VALID_OUTCOMES = Set.of(OUTCOME_AUTO, OUTCOME_TRANSFERRED, OUTCOME_DROPPED);

    private final StudentMarksRepository studentMarksRepository;
    private final StudentAcademicRepository studentAcademicRepository;
    private final StudentRepository studentRepository;
    private final CourseSubjectRepository courseSubjectRepository;
    private final SubjectRepository subjectRepository;
    private final ClassRepository classRepository;
    private final SchoolRepository schoolRepository;
    private final AcademicYearRepository academicYearRepository;

    @Override
    @Transactional(readOnly = true)
    public StudentMarksResponseDto getMarksByStudentAcademicId(Integer studentAcademicId) {
        StudentAcademic academic = requireAcademic(studentAcademicId);
        Student student = requireStudent(academic.getStudentId());
        ClassMaster classMaster = requireClass(academic.getClassId());
        SchoolMaster school = academic.getSchoolId() != null
                ? schoolRepository.findById(academic.getSchoolId()).orElse(null)
                : null;
        AcademicYear academicYear = academic.getAcademicYearId() != null
                ? academicYearRepository.findById(academic.getAcademicYearId()).orElse(null)
                : null;

        List<CourseSubject> subjects = courseSubjectRepository
                .findByCourseIdAndClassIdAndIsDeletedFalseOrderByCourseSubjectIdAsc(
                        classMaster.getCourseId(), classMaster.getClassId());
        Map<Integer, String> subjectNames = resolveSubjectNames(subjects);

        Map<Integer, StudentMarks> existingMarks = studentMarksRepository
                .findByStudentAcademicIdAndIsDeletedFalse(studentAcademicId)
                .stream()
                .collect(Collectors.toMap(StudentMarks::getCourseSubjectId, Function.identity()));

        List<SubjectMarksResponseDto> subjectRows = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        BigDecimal maxTotal = MAX_MARKS.multiply(BigDecimal.valueOf(subjects.size()));
        boolean complete = !subjects.isEmpty();

        for (CourseSubject cs : subjects) {
            StudentMarks marksRow = existingMarks.get(cs.getCourseSubjectId());
            SubjectMarksResponseDto row = SubjectMarksResponseDto.builder()
                    .courseSubjectId(cs.getCourseSubjectId())
                    .subjectId(cs.getSubjectId())
                    .subjectName(subjectNames.get(cs.getSubjectId()))
                    .subjectCode(cs.getSubjectCode())
                    .marks(marksRow != null ? marksRow.getMarks() : null)
                    .result(marksRow != null ? marksRow.getResult() : null)
                    .build();
            subjectRows.add(row);

            if (marksRow == null || marksRow.getMarks() == null) {
                complete = false;
            } else {
                total = total.add(marksRow.getMarks());
            }
        }

        BigDecimal percentage = null;
        String overallResult = null;
        if (complete) {
            percentage = total.divide(maxTotal, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);
            overallResult = subjectRows.stream().allMatch(r -> RESULT_PASS.equals(r.getResult()))
                    ? RESULT_PASS
                    : RESULT_FAIL;
        }

        return buildResponse(academic, student, classMaster, school, academicYear, subjectRows,
                complete ? total : null, maxTotal, percentage, overallResult);
    }

    @Override
    @Transactional
    public StudentMarksResponseDto saveAnnualMarks(StudentMarksRequestDto request) {
        if (request == null || request.getStudentAcademicId() == null) {
            throw new IllegalArgumentException("studentAcademicId is required");
        }
        if (request.getStudentId() == null) {
            throw new IllegalArgumentException("studentId is required");
        }
        if (request.getMarks() == null || request.getMarks().isEmpty()) {
            throw new IllegalArgumentException("At least one subject marks entry is required");
        }

        StudentAcademic academic = requireAcademic(request.getStudentAcademicId());
        if (!Objects.equals(academic.getStudentId(), request.getStudentId())) {
            throw new IllegalArgumentException("studentAcademic record does not belong to the selected student");
        }
        Student student = requireStudent(academic.getStudentId());
        ClassMaster classMaster = requireClass(academic.getClassId());
        SchoolMaster school = academic.getSchoolId() != null
                ? schoolRepository.findById(academic.getSchoolId()).orElse(null)
                : null;
        AcademicYear academicYear = academic.getAcademicYearId() != null
                ? academicYearRepository.findById(academic.getAcademicYearId()).orElse(null)
                : null;

        List<CourseSubject> classSubjects = courseSubjectRepository
                .findByCourseIdAndClassIdAndIsDeletedFalseOrderByCourseSubjectIdAsc(
                        classMaster.getCourseId(), classMaster.getClassId());
        if (classSubjects.isEmpty()) {
            throw new IllegalArgumentException("No subjects are configured for class " + classMaster.getClassName());
        }
        Map<Integer, CourseSubject> classSubjectMap = classSubjects.stream()
                .collect(Collectors.toMap(CourseSubject::getCourseSubjectId, Function.identity()));
        Map<Integer, String> subjectNames = resolveSubjectNames(classSubjects);

        Map<Integer, StudentMarksEntryDto> requestMap = new LinkedHashMap<>();
        for (StudentMarksEntryDto entry : request.getMarks()) {
            if (entry == null || entry.getCourseSubjectId() == null) {
                throw new IllegalArgumentException("courseSubjectId is required for every marks entry");
            }
            if (requestMap.containsKey(entry.getCourseSubjectId())) {
                throw new IllegalArgumentException("Duplicate entry for courseSubjectId " + entry.getCourseSubjectId());
            }
            requestMap.put(entry.getCourseSubjectId(), entry);
        }

        List<String> missingSubjects = classSubjects.stream()
                .filter(cs -> !requestMap.containsKey(cs.getCourseSubjectId()))
                .map(CourseSubject::getSubjectCode)
                .toList();
        if (!missingSubjects.isEmpty()) {
            throw new IllegalArgumentException("Marks are missing for subjects: " + String.join(", ", missingSubjects));
        }
        for (Integer courseSubjectId : requestMap.keySet()) {
            if (!classSubjectMap.containsKey(courseSubjectId)) {
                throw new IllegalArgumentException("courseSubjectId " + courseSubjectId
                        + " does not belong to class " + classMaster.getClassName());
            }
        }

        Integer userId = request.getCreatedBy() != null ? request.getCreatedBy() : SecurityUtil.getCurrentUserId();
        LocalDateTime now = LocalDateTime.now();

        BigDecimal total = BigDecimal.ZERO;
        List<SubjectMarksResponseDto> subjectRows = new ArrayList<>();
        for (CourseSubject cs : classSubjects) {
            StudentMarksEntryDto entry = requestMap.get(cs.getCourseSubjectId());
            BigDecimal marks = validateMarks(cs, entry);

            Optional<StudentMarks> existingRow = studentMarksRepository
                    .findByStudentAcademicIdAndCourseSubjectIdAndIsDeletedFalse(
                            academic.getStudentAcademicId(), cs.getCourseSubjectId());

            String result = marks.compareTo(PASS_MARKS) >= 0 ? RESULT_PASS : RESULT_FAIL;

            if (existingRow.isPresent()) {
                StudentMarks row = existingRow.get();
                row.setMarks(marks);
                row.setResult(result);
                row.setUpdatedAt(now);
                row.setUpdatedBy(userId);
                studentMarksRepository.save(row);
            } else {
                studentMarksRepository.save(StudentMarks.builder()
                        .studentAcademicId(academic.getStudentAcademicId())
                        .courseSubjectId(cs.getCourseSubjectId())
                        .marks(marks)
                        .result(result)
                        .isDeleted(false)
                        .createdAt(now)
                        .createdBy(userId)
                        .updatedAt(now)
                        .updatedBy(userId)
                        .build());
            }

            total = total.add(marks);
            subjectRows.add(SubjectMarksResponseDto.builder()
                    .courseSubjectId(cs.getCourseSubjectId())
                    .subjectId(cs.getSubjectId())
                    .subjectName(subjectNames.get(cs.getSubjectId()))
                    .subjectCode(cs.getSubjectCode())
                    .marks(marks)
                    .result(result)
                    .build());
        }

        BigDecimal maxTotal = MAX_MARKS.multiply(BigDecimal.valueOf(classSubjects.size()));
        BigDecimal percentage = total.divide(maxTotal, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
        String overallResult = subjectRows.stream().allMatch(r -> RESULT_PASS.equals(r.getResult()))
                ? RESULT_PASS
                : RESULT_FAIL;

        return buildResponse(academic, student, classMaster, school, academicYear, subjectRows,
                total, maxTotal, percentage, overallResult);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassStudentResponseDto> getClassStudents(Integer academicYearId, Integer schoolId, Integer classId) {
        requireAcademicYear(academicYearId);
        requireSchool(schoolId);
        requireClass(classId);
        return studentAcademicRepository.findClassRoster(academicYearId, schoolId, classId)
                .stream()
                .map(this::toClassStudentResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ClassMarksSheetResponseDto getClassMarksSheet(Integer academicYearId, Integer schoolId, Integer classId) {
        return buildClassSheet(academicYearId, schoolId, classId);
    }

    @Override
    @Transactional
    public ClassMarksSheetResponseDto saveClassAnnualMarks(ClassMarksRequestDto request) {
        if (request == null || request.getAcademicYearId() == null
                || request.getSchoolId() == null || request.getClassId() == null) {
            throw new IllegalArgumentException("academicYearId, schoolId and classId are required");
        }
        if (request.getStudents() == null || request.getStudents().isEmpty()) {
            throw new IllegalArgumentException("At least one student marks entry is required");
        }

        AcademicYear academicYear = requireAcademicYear(request.getAcademicYearId());
        SchoolMaster school = requireSchool(request.getSchoolId());
        ClassMaster classMaster = requireClass(request.getClassId());

        List<CourseSubject> classSubjects = courseSubjectRepository
                .findByCourseIdAndClassIdAndIsDeletedFalseOrderByCourseSubjectIdAsc(
                        classMaster.getCourseId(), classMaster.getClassId());
        if (classSubjects.isEmpty()) {
            throw new IllegalArgumentException("No subjects are configured for class " + classMaster.getClassName());
        }
        Map<Integer, CourseSubject> classSubjectMap = classSubjects.stream()
                .collect(Collectors.toMap(CourseSubject::getCourseSubjectId, Function.identity()));

        Map<Integer, StudentClassMarksEntryDto> studentEntryMap = new LinkedHashMap<>();
        for (StudentClassMarksEntryDto studentEntry : request.getStudents()) {
            if (studentEntry == null || studentEntry.getStudentAcademicId() == null) {
                throw new IllegalArgumentException("studentAcademicId is required for every student entry");
            }
            if (studentEntryMap.containsKey(studentEntry.getStudentAcademicId())) {
                throw new IllegalArgumentException("Duplicate entry for studentAcademicId " + studentEntry.getStudentAcademicId());
            }
            studentEntryMap.put(studentEntry.getStudentAcademicId(), studentEntry);
        }

        Map<Integer, StudentAcademic> validatedAcademics = new LinkedHashMap<>();
        for (Integer studentAcademicId : studentEntryMap.keySet()) {
            StudentAcademic academic = requireAcademic(studentAcademicId);
            if (!Boolean.TRUE.equals(academic.getIsActive()) && !isFinalized(academic)) {
                throw new IllegalArgumentException("Student academic record is not active with id " + studentAcademicId);
            }
            if (!Objects.equals(academic.getAcademicYearId(), request.getAcademicYearId())) {
                throw new IllegalArgumentException("studentAcademicId " + studentAcademicId
                        + " does not belong to the selected academic year");
            }
            if (!Objects.equals(academic.getSchoolId(), request.getSchoolId())) {
                throw new IllegalArgumentException("studentAcademicId " + studentAcademicId
                        + " does not belong to the selected school");
            }
            if (!Objects.equals(academic.getClassId(), request.getClassId())) {
                throw new IllegalArgumentException("studentAcademicId " + studentAcademicId
                        + " does not belong to the selected class");
            }
            requireStudent(academic.getStudentId());
            validatedAcademics.put(studentAcademicId, academic);
        }

        for (StudentClassMarksEntryDto studentEntry : studentEntryMap.values()) {
            List<StudentMarksEntryDto> entries = studentEntry.getMarks();
            if (entries == null || entries.isEmpty()) {
                throw new IllegalArgumentException("At least one subject marks entry is required for studentAcademicId "
                        + studentEntry.getStudentAcademicId());
            }
            String outcome = studentEntry.getOutcome();
            if (outcome != null && !outcome.isBlank() && !VALID_OUTCOMES.contains(outcome)) {
                throw new IllegalArgumentException("Invalid outcome '" + outcome + "' for studentAcademicId "
                        + studentEntry.getStudentAcademicId() + ". Allowed values: AUTO, TRANSFERRED, DROPPED");
            }

            Map<Integer, StudentMarksEntryDto> requestMap = new LinkedHashMap<>();
            for (StudentMarksEntryDto markEntry : entries) {
                if (markEntry == null || markEntry.getCourseSubjectId() == null) {
                    throw new IllegalArgumentException("courseSubjectId is required for every marks entry");
                }
                if (requestMap.containsKey(markEntry.getCourseSubjectId())) {
                    throw new IllegalArgumentException("Duplicate entry for courseSubjectId " + markEntry.getCourseSubjectId());
                }
                requestMap.put(markEntry.getCourseSubjectId(), markEntry);
            }

            List<String> missingSubjects = classSubjects.stream()
                    .filter(cs -> !requestMap.containsKey(cs.getCourseSubjectId()))
                    .map(CourseSubject::getSubjectCode)
                    .toList();
            if (!missingSubjects.isEmpty()) {
                throw new IllegalArgumentException("Marks are missing for studentAcademicId "
                        + studentEntry.getStudentAcademicId() + " for subjects: " + String.join(", ", missingSubjects));
            }
            for (Integer courseSubjectId : requestMap.keySet()) {
                if (!classSubjectMap.containsKey(courseSubjectId)) {
                    throw new IllegalArgumentException("courseSubjectId " + courseSubjectId
                            + " does not belong to class " + classMaster.getClassName());
                }
            }
            for (CourseSubject cs : classSubjects) {
                validateMarks(cs, requestMap.get(cs.getCourseSubjectId()));
            }
        }

        Integer userId = SecurityUtil.getCurrentUserId();
        LocalDateTime now = LocalDateTime.now();

        Map<Integer, String> overallResults = new LinkedHashMap<>();
        for (Map.Entry<Integer, StudentAcademic> entry : validatedAcademics.entrySet()) {
            StudentAcademic academic = entry.getValue();
            List<StudentMarksEntryDto> entries = studentEntryMap.get(entry.getKey()).getMarks();
            Map<Integer, StudentMarksEntryDto> requestMap = entries.stream()
                    .collect(Collectors.toMap(StudentMarksEntryDto::getCourseSubjectId, Function.identity(), (a, b) -> a, LinkedHashMap::new));

            List<String> subjectResults = new ArrayList<>();
            for (CourseSubject cs : classSubjects) {
                StudentMarksEntryDto markEntry = requestMap.get(cs.getCourseSubjectId());
                BigDecimal marks = validateMarks(cs, markEntry);
                String result = marks.compareTo(PASS_MARKS) >= 0 ? RESULT_PASS : RESULT_FAIL;
                subjectResults.add(result);

                Optional<StudentMarks> existingRow = studentMarksRepository
                        .findByStudentAcademicIdAndCourseSubjectIdAndIsDeletedFalse(
                                academic.getStudentAcademicId(), cs.getCourseSubjectId());

                if (existingRow.isPresent()) {
                    StudentMarks row = existingRow.get();
                    row.setMarks(marks);
                    row.setResult(result);
                    row.setUpdatedAt(now);
                    row.setUpdatedBy(userId);
                    studentMarksRepository.save(row);
                } else {
                    studentMarksRepository.save(StudentMarks.builder()
                            .studentAcademicId(academic.getStudentAcademicId())
                            .courseSubjectId(cs.getCourseSubjectId())
                            .marks(marks)
                            .result(result)
                            .isDeleted(false)
                            .createdAt(now)
                            .createdBy(userId)
                            .updatedAt(now)
                            .updatedBy(userId)
                            .build());
                }
            }
            overallResults.put(entry.getKey(),
                    subjectResults.stream().allMatch(RESULT_PASS::equals) ? RESULT_PASS : RESULT_FAIL);
        }

        Map<Integer, StudentOutcomeSummaryDto> outcomes = new LinkedHashMap<>();
        for (Map.Entry<Integer, StudentAcademic> entry : validatedAcademics.entrySet()) {
            StudentAcademic academic = entry.getValue();
            StudentClassMarksEntryDto studentEntry = studentEntryMap.get(entry.getKey());
            if (isFinalized(academic)) {
                outcomes.put(entry.getKey(), existingOutcomeSummary(academic));
            } else {
                outcomes.put(entry.getKey(),
                        applyOutcome(academic, studentEntry.getOutcome(), overallResults.get(entry.getKey()), userId, now));
            }
        }

        ClassMarksSheetResponseDto sheet = buildClassSheet(request.getAcademicYearId(), request.getSchoolId(), request.getClassId());
        sheet.setOutcomes(outcomes);
        return sheet;
    }

    private ClassMarksSheetResponseDto buildClassSheet(Integer academicYearId, Integer schoolId, Integer classId) {
        AcademicYear academicYear = requireAcademicYear(academicYearId);
        SchoolMaster school = requireSchool(schoolId);
        ClassMaster classMaster = requireClass(classId);

        List<CourseSubject> subjects = courseSubjectRepository
                .findByCourseIdAndClassIdAndIsDeletedFalseOrderByCourseSubjectIdAsc(
                        classMaster.getCourseId(), classMaster.getClassId());
        Map<Integer, String> subjectNames = resolveSubjectNames(subjects);

        List<CourseSubjectMarksDto> subjectRows = subjects.stream()
                .map(cs -> CourseSubjectMarksDto.builder()
                        .courseSubjectId(cs.getCourseSubjectId())
                        .courseId(cs.getCourseId())
                        .classId(cs.getClassId())
                        .subjectId(cs.getSubjectId())
                        .subjectName(subjectNames.get(cs.getSubjectId()))
                        .subjectCode(cs.getSubjectCode())
                        .build())
                .toList();

        List<ClassStudentDto> roster = studentAcademicRepository.findClassRoster(academicYearId, schoolId, classId);
        List<ClassStudentResponseDto> studentRows = roster.stream()
                .map(this::toClassStudentResponse)
                .toList();

        List<Integer> studentAcademicIds = roster.stream()
                .map(ClassStudentDto::getStudentAcademicId)
                .toList();

        Map<Integer, Map<Integer, SubjectMarksResponseDto>> existingMarks = new LinkedHashMap<>();
        if (!studentAcademicIds.isEmpty()) {
            Map<Integer, List<StudentMarks>> marksByStudent = studentMarksRepository
                    .findByStudentAcademicIdInAndIsDeletedFalse(studentAcademicIds)
                    .stream()
                    .collect(Collectors.groupingBy(StudentMarks::getStudentAcademicId, LinkedHashMap::new, Collectors.toList()));

            for (ClassStudentDto student : roster) {
                Map<Integer, StudentMarks> bySubject = marksByStudent
                        .getOrDefault(student.getStudentAcademicId(), List.of())
                        .stream()
                        .collect(Collectors.toMap(StudentMarks::getCourseSubjectId, Function.identity()));

                Map<Integer, SubjectMarksResponseDto> studentSubjectRows = new LinkedHashMap<>();
                for (CourseSubject cs : subjects) {
                    StudentMarks row = bySubject.get(cs.getCourseSubjectId());
                    studentSubjectRows.put(cs.getCourseSubjectId(), SubjectMarksResponseDto.builder()
                            .courseSubjectId(cs.getCourseSubjectId())
                            .subjectId(cs.getSubjectId())
                            .subjectName(subjectNames.get(cs.getSubjectId()))
                            .subjectCode(cs.getSubjectCode())
                            .marks(row != null ? row.getMarks() : null)
                            .result(row != null ? row.getResult() : null)
                            .build());
                }
                existingMarks.put(student.getStudentAcademicId(), studentSubjectRows);
            }
        }

        return ClassMarksSheetResponseDto.builder()
                .academicYearId(academicYear.getAcademicYearId())
                .academicYearName(academicYear.getAcademicYearName())
                .schoolId(school.getSchId())
                .schoolName(school.getSchName())
                .classId(classMaster.getClassId())
                .className(classMaster.getClassName())
                .subjects(subjectRows)
                .students(studentRows)
                .existingMarks(existingMarks)
                .outcomes(new LinkedHashMap<>())
                .build();
    }

    private ClassStudentResponseDto toClassStudentResponse(ClassStudentDto student) {
        return ClassStudentResponseDto.builder()
                .studentAcademicId(student.getStudentAcademicId())
                .studentId(student.getStudentId())
                .rollNumber(student.getRollNumber())
                .studentName(student.getStudentName())
                .status(student.getStatus())
                .build();
    }

    private Map<Integer, String> resolveSubjectNames(List<CourseSubject> subjects) {
        if (subjects.isEmpty()) {
            return Map.of();
        }
        return subjectRepository.findBySubjectIdInAndIsDeletedFalse(
                        subjects.stream().map(CourseSubject::getSubjectId).toList())
                .stream()
                .collect(Collectors.toMap(SubjectMaster::getSubjectId, SubjectMaster::getSubjectName));
    }

    private BigDecimal validateMarks(CourseSubject cs, StudentMarksEntryDto entry) {
        if (entry.getMarks() == null) {
            throw new IllegalArgumentException("Marks are required for subject " + cs.getSubjectCode());
        }
        BigDecimal marks = entry.getMarks().setScale(2, RoundingMode.HALF_UP);
        if (marks.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Marks cannot be negative for subject " + cs.getSubjectCode());
        }
        if (marks.compareTo(MAX_MARKS) > 0) {
            throw new IllegalArgumentException("Marks cannot exceed " + MAX_MARKS + " for subject " + cs.getSubjectCode());
        }
        return marks;
    }

    private StudentOutcomeSummaryDto applyOutcome(
            StudentAcademic academic,
            String rawOutcome,
            String overallResult,
            Integer userId,
            LocalDateTime now
    ) {
        String outcome = normalizeOutcome(rawOutcome);
        String message;
        Integer nextClassId = null;
        AcademicYear nextYear = null;
        String nextAdmissionType = null;

        switch (outcome) {
            case OUTCOME_TRANSFERRED -> {
                message = "Student transferred out of the school. No next academic record.";
            }
            case OUTCOME_DROPPED -> {
                message = "Student dropped out of the school. No next academic record.";
            }
            default -> {
                boolean passed = RESULT_PASS.equals(overallResult);
                nextYear = resolveNextAcademicYear(academic.getAcademicYearId(), userId);
                if (passed) {
                    nextClassId = resolveNextClassId(academic.getClassId());
                    if (nextClassId == null) {
                        message = "Student completed the highest class and graduated. No next academic record.";
                    } else {
                        createNextAcademicRecord(academic, nextYear.getAcademicYearId(), nextClassId,
                                AdmissionType.PROMOTED.getValue(), userId, now);
                        nextAdmissionType = AdmissionType.PROMOTED.getValue();
                        message = "Student passed and was promoted to the next class.";
                    }
                } else {
                    nextClassId = academic.getClassId();
                    createNextAcademicRecord(academic, nextYear.getAcademicYearId(), nextClassId,
                            AdmissionType.RETAINED.getValue(), userId, now);
                    nextAdmissionType = AdmissionType.RETAINED.getValue();
                    message = "Student failed and was retained in the same class.";
                }
            }
        }

        StudentAcademicStatus status = switch (outcome) {
            case OUTCOME_TRANSFERRED -> StudentAcademicStatus.TRANSFERRED;
            case OUTCOME_DROPPED -> StudentAcademicStatus.DROPPED;
            default -> StudentAcademicStatus.COMPLETED;
        };
        setAcademicStatus(academic, status.getValue(), userId, now);

        return StudentOutcomeSummaryDto.builder()
                .studentAcademicId(academic.getStudentAcademicId())
                .outcome(outcome)
                .status(status.getValue())
                .admissionType(nextAdmissionType)
                .nextAcademicYearId(nextYear != null ? nextYear.getAcademicYearId() : null)
                .nextAcademicYearName(nextYear != null ? nextYear.getAcademicYearName() : null)
                .nextClassId(nextClassId)
                .nextClassName(nextClassId != null ? requireClass(nextClassId).getClassName() : null)
                .message(message)
                .build();
    }

    private String normalizeOutcome(String rawOutcome) {
        if (rawOutcome == null || rawOutcome.isBlank()) {
            return OUTCOME_AUTO;
        }
        return rawOutcome.trim();
    }

    private boolean isFinalized(StudentAcademic academic) {
        return academic.getStatus() != null && !StudentAcademicStatus.ACTIVE.getValue().equals(academic.getStatus());
    }

    private StudentOutcomeSummaryDto existingOutcomeSummary(StudentAcademic academic) {
        String outcome = StudentAcademicStatus.TRANSFERRED.getValue().equals(academic.getStatus())
                ? OUTCOME_TRANSFERRED
                : StudentAcademicStatus.DROPPED.getValue().equals(academic.getStatus())
                        ? OUTCOME_DROPPED
                        : OUTCOME_AUTO;
        return StudentOutcomeSummaryDto.builder()
                .studentAcademicId(academic.getStudentAcademicId())
                .outcome(outcome)
                .status(academic.getStatus())
                .message("Student already finalized; outcome is locked.")
                .build();
    }

    private void setAcademicStatus(StudentAcademic academic, String status, Integer userId, LocalDateTime now) {
        academic.setStatus(status);
        academic.setIsActive(false);
        academic.setUpdatedAt(now);
        academic.setUpdatedBy(userId);
        studentAcademicRepository.save(academic);
    }

    private void createNextAcademicRecord(
            StudentAcademic academic,
            Integer nextAcademicYearId,
            Integer nextClassId,
            String admissionType,
            Integer userId,
            LocalDateTime now
    ) {
        studentAcademicRepository.save(StudentAcademic.builder()
                .studentId(academic.getStudentId())
                .academicYearId(nextAcademicYearId)
                .schoolId(academic.getSchoolId())
                .classId(nextClassId)
                .rollNumber(academic.getRollNumber())
                .admissionType(admissionType)
                .status(StudentAcademicStatus.ACTIVE.getValue())
                .isActive(true)
                .isDeleted(false)
                .createdAt(now)
                .createdBy(userId)
                .updatedAt(now)
                .updatedBy(userId)
                .build());
    }

    private AcademicYear resolveNextAcademicYear(Integer currentAcademicYearId, Integer userId) {
        AcademicYear current = requireAcademicYear(currentAcademicYearId);
        LocalDate anchor = current.getEndDate() != null ? current.getEndDate() : current.getStartDate();
        LocalDate anchorDate = anchor != null ? anchor : LocalDate.now();

        Optional<AcademicYear> existing = academicYearRepository
                .findFirstByIsDeletedFalseAndStartDateGreaterThanOrderByStartDateAsc(anchorDate);
        if (existing.isPresent()) {
            return existing.get();
        }

        LocalDate nextStart = anchorDate.plusDays(1);
        LocalDate nextEnd = nextStart.plusYears(1).minusDays(1);
        String name = nextStart.getYear() + "-" + nextEnd.getYear();
        LocalDateTime now = LocalDateTime.now();
        return academicYearRepository.save(AcademicYear.builder()
                .academicYearName(name)
                .startDate(nextStart)
                .endDate(nextEnd)
                .isCurrent(false)
                .isActive(true)
                .isDeleted(false)
                .createdAt(now)
                .updatedAt(now)
                .build());
    }

    private Integer resolveNextClassId(Integer currentClassId) {
        ClassMaster current = requireClass(currentClassId);
        List<ClassMaster> classes = classRepository
                .findByCourseIdAndIsDeletedFalseOrderByClassOrderAsc(current.getCourseId());
        int index = -1;
        for (int i = 0; i < classes.size(); i++) {
            if (Objects.equals(classes.get(i).getClassId(), currentClassId)) {
                index = i;
                break;
            }
        }
        if (index >= 0 && index + 1 < classes.size()) {
            return classes.get(index + 1).getClassId();
        }
        return null;
    }

    private StudentAcademic requireAcademic(Integer studentAcademicId) {
        return studentAcademicRepository.findByStudentAcademicIdAndIsDeletedFalse(studentAcademicId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Student academic record not found with id " + studentAcademicId));
    }

    private SchoolMaster requireSchool(Integer schoolId) {
        return schoolRepository.findById(schoolId)
                .filter(s -> !Boolean.TRUE.equals(s.getIsDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException("School not found with id " + schoolId));
    }

    private AcademicYear requireAcademicYear(Integer academicYearId) {
        return academicYearRepository.findById(academicYearId)
                .filter(a -> !Boolean.TRUE.equals(a.getIsDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException("Academic year not found with id " + academicYearId));
    }

    private Student requireStudent(Integer studentId) {
        return studentRepository.findById(studentId)
                .filter(s -> !Boolean.TRUE.equals(s.getIsDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id " + studentId));
    }

    private ClassMaster requireClass(Integer classId) {
        return classRepository.findById(classId)
                .filter(c -> !Boolean.TRUE.equals(c.getIsDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException("Class not found with id " + classId));
    }

    private StudentMarksResponseDto buildResponse(
            StudentAcademic academic,
            Student student,
            ClassMaster classMaster,
            SchoolMaster school,
            AcademicYear academicYear,
            List<SubjectMarksResponseDto> subjects,
            BigDecimal total,
            BigDecimal maxTotal,
            BigDecimal percentage,
            String overallResult
    ) {
        String studentName = buildStudentName(student);
        return StudentMarksResponseDto.builder()
                .studentAcademicId(academic.getStudentAcademicId())
                .studentId(academic.getStudentId())
                .studentName(studentName)
                .academicYearId(academic.getAcademicYearId())
                .academicYearName(academicYear != null ? academicYear.getAcademicYearName() : null)
                .courseId(classMaster.getCourseId())
                .classId(classMaster.getClassId())
                .className(classMaster.getClassName())
                .schoolId(academic.getSchoolId())
                .schoolName(school != null ? school.getSchName() : null)
                .rollNumber(academic.getRollNumber())
                .totalMarks(total)
                .maxTotal(maxTotal)
                .percentage(percentage)
                .overallResult(overallResult)
                .subjects(subjects)
                .build();
    }

    private String buildStudentName(Student student) {
        if (student == null) {
            return null;
        }
        return (student.getFirstName() != null ? student.getFirstName() : "")
                + (student.getLastName() != null && !student.getLastName().isBlank() ? " " + student.getLastName() : "");
    }
}