package com.saho.foundation.service.impl;

import com.saho.foundation.dto.imports.BulkImportResponse;
import com.saho.foundation.dto.imports.ImportErrorDto;
import com.saho.foundation.dto.imports.StudentImportRow;
import com.saho.foundation.entity.AcademicYear;
import com.saho.foundation.entity.*;
import com.saho.foundation.enums.Gender;
import com.saho.foundation.enums.ParentStatus;
import com.saho.foundation.enums.OrphanStatus;
import com.saho.foundation.enums.Religion;
import com.saho.foundation.repository.*;
import com.saho.foundation.service.iservices.StudentFamilyService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class StudentImportService {

    private static final Logger log = LoggerFactory.getLogger(StudentImportService.class);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern AADHAAR_PATTERN = Pattern.compile("^\\d{12}$");
    private static final Pattern DATE_PATTERN = Pattern.compile("^\\d{2}-\\d{2}-\\d{4}$");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd-MM-yyyy");
    private static final Set<String> VALID_BLOOD_GROUPS = Set.of("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-");
    private static final Set<String> VALID_RELATIONSHIPS = Set.of("Father", "Mother", "Guardian");
    private static final List<String> TEMPLATE_HEADERS = List.of(
            "First Name", "Last Name", "Email", "DOB", "Gender",
            "Aadhaar", "Religion", "Blood Group", "Caste",
            "State", "District", "Mandal", "Village", "School", "Class",
            "Guardian First Name", "Guardian Last Name",
            "Guardian Phone", "Relationship", "Occupation", "Address",
            "Orphan Status"
    );

    private final StudentRepository studentRepository;
    private final GuardianRepository guardianRepository;
    private final StateRepository stateRepository;
    private final DistrictRepository districtRepository;
    private final MandalRepository mandalRepository;
    private final VillageRepository villageRepository;
    private final SchoolRepository schoolRepository;
    private final AcademicYearRepository academicYearRepository;
    private final CasteRepository casteRepository;
    private final RelationshipRepository relationshipRepository;
    private final ClassRepository classRepository;
    private final SponsorRepository sponsorRepository;
    private final StudentSponsorRepository studentSponsorRepository;
    private final StudentFamilyService studentFamilyService;

    public byte[] generateTemplate() throws IOException {
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

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < TEMPLATE_HEADERS.size(); i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(TEMPLATE_HEADERS.get(i));
                cell.setCellStyle(headerStyle);
                sheet.autoSizeColumn(i);
            }

            Row exampleRow = sheet.createRow(1);
            exampleRow.createCell(0).setCellValue("Raj");
            exampleRow.createCell(1).setCellValue("Kumar");
            exampleRow.createCell(2).setCellValue("raj.kumar@email.com");
            exampleRow.createCell(3).setCellValue("10-10-2017");
            exampleRow.createCell(4).setCellValue("Male");
            exampleRow.createCell(5).setCellValue("123456789012");
            exampleRow.createCell(6).setCellValue("Hindu");
            exampleRow.createCell(7).setCellValue("O+");
            exampleRow.createCell(8).setCellValue("BC-A");
            exampleRow.createCell(9).setCellValue("Andhra Pradesh");
            exampleRow.createCell(10).setCellValue("Nellore");
            exampleRow.createCell(11).setCellValue("Kavali");
            exampleRow.createCell(12).setCellValue("Kavali");
            exampleRow.createCell(13).setCellValue("ZPHS School");
            exampleRow.createCell(14).setCellValue("6");
            exampleRow.createCell(15).setCellValue("Kumar");
            exampleRow.createCell(16).setCellValue("");
            exampleRow.createCell(17).setCellValue("9876543210");
            exampleRow.createCell(18).setCellValue("Father");
            exampleRow.createCell(19).setCellValue("Farmer");
            exampleRow.createCell(20).setCellValue("Kavali, Nellore");
            exampleRow.createCell(21).setCellValue("None");

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            workbook.write(bos);
            return bos.toByteArray();
        }
    }

    @Transactional
    public BulkImportResponse importStudents(MultipartFile file) {
        List<StudentImportRow> rows = parseExcel(file);
        List<ImportErrorDto> allErrors = new ArrayList<>();
        Set<Integer> invalidRowNumbers = new HashSet<>();

        Set<String> aadhaarInFile = new HashSet<>();
        for (StudentImportRow row : rows) {
            List<String> rowErrors = new ArrayList<>();

            validateRequiredFields(row, rowErrors);
            validateFormats(row, rowErrors);

            if (!row.getAadhaar().isEmpty() && AADHAAR_PATTERN.matcher(row.getAadhaar()).matches()) {
                if (studentRepository.existsByAadhaarNumberAndIsDeletedFalse(row.getAadhaar())) {
                    rowErrors.add("Student with Aadhaar already exists");
                } else if (!aadhaarInFile.add(row.getAadhaar())) {
                    rowErrors.add("Duplicate Aadhaar found in uploaded file");
                }
            }

            if (!row.getEmail().isEmpty() && EMAIL_PATTERN.matcher(row.getEmail()).matches()) {
                if (studentRepository.existsByEmailIdAndIsDeletedFalse(row.getEmail())) {
                    rowErrors.add("Student with email already exists");
                }
            }

            if (!rowErrors.isEmpty()) {
                for (String msg : rowErrors) {
                    allErrors.add(ImportErrorDto.builder().row(row.getRowNumber()).message(msg).build());
                    invalidRowNumbers.add(row.getRowNumber());
                }
            }
        }

        List<ImportErrorDto> hierarchyErrors = validateHierarchy(rows);
        for (ImportErrorDto error : hierarchyErrors) {
            allErrors.add(error);
            invalidRowNumbers.add(error.getRow());
        }

        if (!allErrors.isEmpty()) {
            return BulkImportResponse.builder()
                    .success(false)
                    .totalRows(rows.size())
                    .validRows(rows.size() - invalidRowNumbers.size())
                    .invalidRows(invalidRowNumbers.size())
                    .errors(allErrors)
                    .build();
        }

        return saveStudents(rows);
    }

    private void validateRequiredFields(StudentImportRow row, List<String> errors) {
        if (row.getFirstName().isEmpty()) errors.add("First Name is required");
        if (row.getLastName().isEmpty()) errors.add("Last Name is required");
        if (row.getDob().isEmpty()) errors.add("DOB is required");
        if (row.getGender().isEmpty()) errors.add("Gender is required");
        if (row.getAadhaar().isEmpty()) errors.add("Aadhaar is required");
        if (row.getState().isEmpty()) errors.add("State is required");
        if (row.getDistrict().isEmpty()) errors.add("District is required");
        if (row.getMandal().isEmpty()) errors.add("Mandal is required");
        if (row.getVillage().isEmpty()) errors.add("Village is required");
        if (row.getSchool().isEmpty()) errors.add("School is required");
        if (row.getClassName().isEmpty()) errors.add("Class is required");
        if (row.getGuardianFirstName().isEmpty()) errors.add("Guardian First Name is required");
        if (row.getGuardianLastName().isEmpty()) errors.add("Guardian Last Name is required");
        if (row.getGuardianPhone().isEmpty()) errors.add("Guardian Phone is required");
        if (row.getRelationship().isEmpty()) errors.add("Relationship is required");
    }

    private void validateFormats(StudentImportRow row, List<String> errors) {
        if (!row.getEmail().isEmpty() && !EMAIL_PATTERN.matcher(row.getEmail()).matches()) {
            errors.add("Invalid email address");
        }

        if (!row.getDob().isEmpty()) {
            if (!DATE_PATTERN.matcher(row.getDob()).matches()) {
                errors.add("Invalid date format");
                errors.add("Expected dd-MM-yyyy");
            } else {
                try {
                    LocalDate.parse(row.getDob(), DATE_FORMATTER);
                } catch (DateTimeParseException e) {
                    errors.add("Invalid date format");
                    errors.add("Expected dd-MM-yyyy");
                }
            }
        }

        if (!row.getGender().isEmpty() && resolveGenderValue(row.getGender()) == null) {
            errors.add("Invalid gender");
        }

        if (!row.getAadhaar().isEmpty() && !AADHAAR_PATTERN.matcher(row.getAadhaar()).matches()) {
            errors.add("Invalid Aadhaar number");
        }

        if (!row.getBloodGroup().isEmpty() && !VALID_BLOOD_GROUPS.contains(row.getBloodGroup())) {
            errors.add("Invalid blood group");
        }

        if (!row.getCaste().isEmpty() && casteRepository.findByCasteNameIgnoreCase(row.getCaste()).isEmpty()) {
            errors.add("Invalid Caste");
        }

        if (!row.getClassName().isEmpty() && classRepository.findByClassNameIgnoreCase(row.getClassName()).isEmpty()) {
            errors.add("Invalid Class");
        }

        if (!row.getRelationship().isEmpty() && !VALID_RELATIONSHIPS.contains(row.getRelationship())) {
            errors.add("Invalid Relationship");
        }
    }

    private List<ImportErrorDto> validateHierarchy(List<StudentImportRow> rows) {
        List<ImportErrorDto> errors = new ArrayList<>();

        for (StudentImportRow row : rows) {
            StateMaster state = stateRepository.findByStNameIgnoreCase(row.getState()).orElse(null);
            if (state == null) {
                errors.add(ImportErrorDto.builder().row(row.getRowNumber()).message("Invalid State").build());
                continue;
            }

            DistrictMaster district = districtRepository.findByDistNameIgnoreCaseAndStId(row.getDistrict(), state.getStId()).orElse(null);
            if (district == null) {
                errors.add(ImportErrorDto.builder().row(row.getRowNumber()).message("District does not belong to selected state").build());
                continue;
            }

            MandalMaster mandal = mandalRepository.findByMndlNameIgnoreCaseAndDistId(row.getMandal(), district.getDistId()).orElse(null);
            if (mandal == null) {
                errors.add(ImportErrorDto.builder().row(row.getRowNumber()).message("Invalid Mandal").build());
                continue;
            }

            VillageMaster village = villageRepository.findByVilNameIgnoreCase(row.getVillage()).orElse(null);
            if (village == null) {
                errors.add(ImportErrorDto.builder().row(row.getRowNumber()).message("Invalid Village").build());
                continue;
            }

            if (!village.getMndlId().equals(mandal.getMndlId())) {
                errors.add(ImportErrorDto.builder().row(row.getRowNumber()).message("Village does not belong to selected Mandal").build());
                continue;
            }

            SchoolMaster school = schoolRepository.findBySchNameIgnoreCase(row.getSchool()).orElse(null);
            if (school == null) {
                errors.add(ImportErrorDto.builder().row(row.getRowNumber()).message("Invalid School").build());
                continue;
            }

            if (!school.getVilId().equals(village.getVilId())) {
                errors.add(ImportErrorDto.builder().row(row.getRowNumber()).message("School does not belong to selected Village").build());
            }
        }

        return errors;
    }

    private List<StudentImportRow> parseExcel(MultipartFile file) {
        List<StudentImportRow> rows = new ArrayList<>();
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheet("Students");
            if (sheet == null) {
                throw new IllegalArgumentException("Sheet named 'Students' not found in the uploaded file");
            }

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                int rowNum = i + 1;

                String firstName = getCellStringValue(row.getCell(0));
                String lastName = getCellStringValue(row.getCell(1));
                String email = getCellStringValue(row.getCell(2));
                String dob = getCellStringValue(row.getCell(3));
                String gender = getCellStringValue(row.getCell(4));
                String aadhaar = getCellStringValue(row.getCell(5));
                String religion = getCellStringValue(row.getCell(6));
                String bloodGroup = getCellStringValue(row.getCell(7));
                String caste = getCellStringValue(row.getCell(8));
                String state = getCellStringValue(row.getCell(9));
                String district = getCellStringValue(row.getCell(10));
                String mandal = getCellStringValue(row.getCell(11));
                String village = getCellStringValue(row.getCell(12));
                String school = getCellStringValue(row.getCell(13));
                String className = getCellStringValue(row.getCell(14));
                String guardianFirstName = getCellStringValue(row.getCell(15));
                String guardianLastName = getCellStringValue(row.getCell(16));
                String guardianPhone = getCellStringValue(row.getCell(17));
                String relationship = getCellStringValue(row.getCell(18));
                String occupation = getCellStringValue(row.getCell(19));
                String address = getCellStringValue(row.getCell(20));
                String orphanStatus = getCellStringValue(row.getCell(21));

                if (log.isDebugEnabled()) {
                    Cell dobCell = row.getCell(4);
                    log.debug("Row {} | DOB Column: cellType={} | rawValue={} | parsedValue={}",
                            rowNum,
                            dobCell == null ? "null" : dobCell.getCellType().name(),
                            dobCell == null ? "null" : getCellRawValue(dobCell),
                            dob);
                }

                StudentImportRow importRow = StudentImportRow.builder()
                        .rowNumber(rowNum)
                        .firstName(firstName)
                        .lastName(lastName)
                        .email(email)
                        .dob(dob)
                        .gender(gender)
                        .aadhaar(aadhaar)
                        .religion(religion)
                        .bloodGroup(bloodGroup)
                        .caste(caste)
                        .state(state)
                        .district(district)
                        .mandal(mandal)
                        .village(village)
                        .school(school)
                        .className(className)
                        .guardianFirstName(guardianFirstName)
                        .guardianLastName(guardianLastName)
                        .guardianPhone(guardianPhone)
                        .relationship(relationship)
                        .occupation(occupation)
                        .address(address)
                        .orphanStatus(orphanStatus)
                        .build();

                if (isEmptyRow(importRow)) continue;

                rows.add(importRow);
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to read Excel file: " + e.getMessage());
        }
        return rows;
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null) return "";
        try {
            return switch (cell.getCellType()) {
                case STRING -> cell.getStringCellValue().trim();
                case NUMERIC -> {
                    if (DateUtil.isCellDateFormatted(cell)) {
                        java.util.Date dateValue = cell.getDateCellValue();
                        String formatted = DATE_FORMATTER.format(
                                dateValue.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate()
                        );
                        log.debug("Date cell detected: rawSerial={} formatted={}",
                                cell.getNumericCellValue(), formatted);
                        yield formatted;
                    }
                    double val = cell.getNumericCellValue();
                    if (val == Math.floor(val) && !Double.isInfinite(val)) {
                        yield String.valueOf((long) val);
                    }
                    yield String.valueOf(val);
                }
                case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
                default -> "";
            };
        } catch (Exception e) {
            log.warn("Failed to read cell value: {}", e.getMessage());
            return "";
        }
    }

    private String getCellRawValue(Cell cell) {
        if (cell == null) return "null";
        try {
            return switch (cell.getCellType()) {
                case STRING -> "\"" + cell.getStringCellValue() + "\"";
                case NUMERIC -> String.valueOf(cell.getNumericCellValue());
                case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
                case FORMULA -> cell.getCellFormula();
                default -> cell.getCellType().name();
            };
        } catch (Exception e) {
            return "error: " + e.getMessage();
        }
    }

    private boolean isEmptyRow(StudentImportRow row) {
        return row.getFirstName().isEmpty()
                && row.getLastName().isEmpty()
                && row.getAadhaar().isEmpty()
                && row.getGuardianPhone().isEmpty();
    }

    public BulkImportResponse saveStudents(List<StudentImportRow> rows) {
        int guardiansCreated = 0;
        int studentsImported = 0;

        Map<String, Guardian> guardianCache = new HashMap<>();

        for (StudentImportRow row : rows) {
            StateMaster state = stateRepository.findByStNameIgnoreCase(row.getState())
                    .orElseThrow(() -> new IllegalStateException("State not found: " + row.getState()));

            DistrictMaster district = districtRepository.findByDistNameIgnoreCaseAndStId(row.getDistrict(), state.getStId())
                    .orElseThrow(() -> new IllegalStateException("District not found: " + row.getDistrict()));

            MandalMaster mandal = mandalRepository.findByMndlNameIgnoreCaseAndDistId(row.getMandal(), district.getDistId())
                    .orElseThrow(() -> new IllegalStateException("Mandal not found: " + row.getMandal()));

            VillageMaster village = villageRepository.findByVilNameIgnoreCase(row.getVillage())
                    .orElseThrow(() -> new IllegalStateException("Village not found: " + row.getVillage()));

            SchoolMaster school = schoolRepository.findBySchNameIgnoreCase(row.getSchool())
                    .orElseThrow(() -> new IllegalStateException("School not found: " + row.getSchool()));

            if (!school.getVilId().equals(village.getVilId())) {
                throw new IllegalStateException("School does not belong to selected Village: " + row.getSchool());
            }

            Integer casteId = null;
            if (!row.getCaste().isEmpty()) {
                casteId = casteRepository.findByCasteNameIgnoreCase(row.getCaste())
                        .map(CasteMaster::getCasteId)
                        .orElse(null);
            }

            Integer classId = classRepository.findByClassNameIgnoreCase(row.getClassName())
                    .map(ClassMaster::getClassId)
                    .orElseThrow(() -> new IllegalStateException("Class not found: " + row.getClassName()));

            Integer relationshipId = relationshipRepository.findByRelationshipNameIgnoreCase(row.getRelationship())
                    .map(RelationshipMaster::getRelationshipId)
                    .orElseThrow(() -> new IllegalStateException("Relationship not found: " + row.getRelationship()));

            String guardianPhone = row.getGuardianPhone();
            log.debug("Processing guardian phone: {}", guardianPhone);

            Guardian guardian = guardianCache.get(guardianPhone);
            if (guardian == null) {
                guardian = guardianRepository.findByPhoneNumber(guardianPhone).orElse(null);
                if (guardian == null) {
                    log.debug("No existing guardian found for phone: {}. Creating new guardian.", guardianPhone);
                    guardian = Guardian.builder()
                            .firstName(row.getGuardianFirstName())
                            .lastName(row.getGuardianLastName())
                            .phoneNumber(guardianPhone)
                            .relationshipId(relationshipId)
                            .occ(row.getOccupation().isEmpty() ? null : row.getOccupation())
                            .addr(row.getAddress().isEmpty() ? null : row.getAddress())
                            .isDeleted(false)
                            .createdAt(LocalDateTime.now())
                            .build();
                    guardian = guardianRepository.save(guardian);
                    guardiansCreated++;
                    log.debug("New guardian saved for phone: {}. guardiansCreated now: {}", guardianPhone, guardiansCreated);
                } else {
                    log.debug("Existing guardian found for phone: {}. guardianId={}. Not incrementing counter.", guardianPhone, guardian.getGuardianId());
                }
                guardianCache.put(guardianPhone, guardian);
            } else {
                log.debug("Guardian found in cache for phone: {}. guardianId={}. Skipping DB lookup.", guardianPhone, guardian.getGuardianId());
            }

            StudentFamily family = createImportStudentFamily(row);

            String email = row.getEmail();
            if (email.isEmpty()) {
                email = row.getAadhaar() + "@saho-foundation.org";
            }

            String religionValue = resolveReligionValue(row.getReligion());
            String orphanStatusValue = resolveOrphanStatusValue(row.getOrphanStatus());
            String genderValue = resolveGenderValue(row.getGender());

            if (genderValue == null) {
                throw new IllegalStateException("Invalid gender: " + row.getGender());
            }

            LocalDate dob = LocalDate.parse(row.getDob(), DATE_FORMATTER);

            Optional<Student> existingStudentOpt = studentRepository.findByAadhaarNumber(row.getAadhaar());

            Student savedStudent;
            if (existingStudentOpt.isPresent() && Boolean.TRUE.equals(existingStudentOpt.get().getIsDeleted())) {
                Student existingStudent = existingStudentOpt.get();
                existingStudent.setIsDeleted(false);
                existingStudent.setFirstName(row.getFirstName());
                existingStudent.setLastName(row.getLastName());
                existingStudent.setEmailId(email);
                existingStudent.setDob(dob);
                existingStudent.setGender(genderValue);
                existingStudent.setAadhaarNumber(row.getAadhaar());
                existingStudent.setCasteId(casteId);
                existingStudent.setReligion(religionValue);
                existingStudent.setBloodGroup(row.getBloodGroup().isEmpty() ? null : row.getBloodGroup());
                existingStudent.setSchId(school.getSchId());
                existingStudent.setClassId(classId);
                existingStudent.setAcademicYearId(resolveCurrentAcademicYearId());
                existingStudent.setFamily(family);
                existingStudent.setGuardian(guardian);
                existingStudent.setOrphanStatus(orphanStatusValue);
                existingStudent.setModifiedAt(LocalDateTime.now());
                savedStudent = studentRepository.save(existingStudent);
            } else {
                Student student = Student.builder()
                        .firstName(row.getFirstName())
                        .lastName(row.getLastName())
                        .emailId(email)
                        .dob(dob)
                        .gender(genderValue)
                        .aadhaarNumber(row.getAadhaar())
                        .casteId(casteId)
                        .religion(religionValue)
                        .bloodGroup(row.getBloodGroup().isEmpty() ? null : row.getBloodGroup())
                        .schId(school.getSchId())
                        .classId(classId)
                        .academicYearId(resolveCurrentAcademicYearId())
                        .family(family)
                        .guardian(guardian)
                        .orphanStatus(orphanStatusValue)
                        .isDeleted(false)
                        .createdAt(LocalDateTime.now())
                        .build();
                savedStudent = studentRepository.save(student);
            }

            assignDefaultSponsor(savedStudent);
            studentsImported++;
        }

        BulkImportResponse response = BulkImportResponse.builder()
                .success(true)
                .totalRows(rows.size())
                .studentsImported(studentsImported)
                .guardiansCreated(guardiansCreated)
                .build();
        log.debug("Final BulkImportResponse: totalRows={}, studentsImported={}, guardiansCreated={}",
                rows.size(), studentsImported, guardiansCreated);
        return response;
    }

    private void assignDefaultSponsor(Student student) {
        Sponsor defaultSponsor = sponsorRepository.findBySponsorNameIgnoreCase("SaHo Foundation")
                .orElse(null);
        if (defaultSponsor == null) {
            log.warn("Default sponsor 'SaHo Foundation' not found. Skipping sponsor assignment.");
            return;
        }

        Optional<StudentSponsor> existingMapping = studentSponsorRepository
                .findByStudentIdAndSponsorIdAndIsActiveTrue(student.getStudentId(), defaultSponsor.getSponsorId());

        if (existingMapping.isEmpty()) {
            StudentSponsor studentSponsor = StudentSponsor.builder()
                    .studentId(student.getStudentId())
                    .sponsorId(defaultSponsor.getSponsorId())
                    .isActive(true)
                    .isDeleted(false)
                    .createdAt(LocalDate.now())
                    .build();
            studentSponsorRepository.save(studentSponsor);
        }
    }

    private String resolveGenderValue(String gender) {
        if (gender == null || gender.isEmpty()) return null;
        for (Gender g : Gender.values()) {
            if (g.getLabel().equalsIgnoreCase(gender) || g.getValue().equals(gender)) {
                return g.getValue();
            }
        }
        return null;
    }

    private String resolveReligionValue(String religion) {
        if (religion == null || religion.isEmpty()) return null;
        Religion resolved = Religion.fromLabel(religion);
        return resolved != null ? resolved.getValue() : null;
    }

    private String resolveOrphanStatusValue(String orphanStatus) {
        if (orphanStatus == null || orphanStatus.isEmpty()) return null;
        OrphanStatus resolved = OrphanStatus.fromLabel(orphanStatus);
        return resolved != null ? resolved.getValue() : null;
    }

    private Integer resolveCurrentAcademicYearId() {
        return academicYearRepository.findByIsCurrentTrueAndIsActiveTrueAndIsDeletedFalse()
                .map(AcademicYear::getAcademicYearId)
                .orElseThrow(() -> new IllegalStateException("Current academic year not found"));
    }

    private StudentFamily createImportStudentFamily(StudentImportRow row) {
        String relationship = row.getRelationship();
        String parentName = joinNames(row.getGuardianFirstName(), row.getGuardianLastName());
        String parentOccupation = row.getOccupation().isEmpty() ? null : row.getOccupation();
        String fatherName = null;
        String fatherOccupation = null;
        String fatherStatus = ParentStatus.UNKNOWN.getValue();
        String motherName = null;
        String motherOccupation = null;
        String motherStatus = ParentStatus.UNKNOWN.getValue();

        if ("Father".equalsIgnoreCase(relationship)) {
            fatherName = parentName;
            fatherOccupation = parentOccupation;
            fatherStatus = ParentStatus.ALIVE.getValue();
        } else if ("Mother".equalsIgnoreCase(relationship)) {
            motherName = parentName;
            motherOccupation = parentOccupation;
            motherStatus = ParentStatus.ALIVE.getValue();
        }

        return studentFamilyService.createOrUpdateStudentFamily(
                null,
                fatherName,
                fatherOccupation,
                fatherStatus,
                motherName,
                motherOccupation,
                motherStatus,
                null
        );
    }

    private String joinNames(String firstName, String lastName) {
        String first = firstName == null ? "" : firstName.trim();
        String last = lastName == null ? "" : lastName.trim();
        if (first.isEmpty() && last.isEmpty()) {
            return null;
        }
        return (first + " " + last).trim();
    }
}
