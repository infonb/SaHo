package com.saho.foundation.service.impl;

import com.saho.foundation.dto.StudentAcademicRequestDto;
import com.saho.foundation.dto.StudentRequestDto;
import com.saho.foundation.dto.StudentResponseDto;
import com.saho.foundation.dto.imports.BulkImportResponse;
import com.saho.foundation.dto.imports.ImportErrorDto;
import com.saho.foundation.dto.imports.StudentImportRow;
import com.saho.foundation.entity.*;
import com.saho.foundation.enums.AdmissionType;
import com.saho.foundation.enums.Gender;
import com.saho.foundation.enums.ParentOccupation;
import com.saho.foundation.enums.ParentStatus;
import com.saho.foundation.enums.OrphanStatus;
import com.saho.foundation.enums.Religion;
import com.saho.foundation.enums.StudentAcademicStatus;
import com.saho.foundation.repository.*;
import com.saho.foundation.service.iservices.StudentService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
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
            "Orphan Status",
            "Roll Number", "Admission Type", "Status", "Remarks",
            "Father Name", "Father Occupation", "Father Status",
            "Mother Name", "Mother Occupation", "Mother Status"
    );

    private final StudentService studentService;
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
            exampleRow.createCell(22).setCellValue("101");
            exampleRow.createCell(23).setCellValue("NEW");
            exampleRow.createCell(24).setCellValue("ACTIVE");
            exampleRow.createCell(25).setCellValue("");
            exampleRow.createCell(26).setCellValue("Raj Kumar");
            exampleRow.createCell(27).setCellValue("Farmer");
            exampleRow.createCell(28).setCellValue("Alive");
            exampleRow.createCell(29).setCellValue("Lakshmi Kumari");
            exampleRow.createCell(30).setCellValue("Homemaker");
            exampleRow.createCell(31).setCellValue("Alive");

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            workbook.write(bos);
            return bos.toByteArray();
        }
    }

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

            String normalizedEmail = row.getEmail().toLowerCase();
            if (!row.getEmail().isEmpty() && EMAIL_PATTERN.matcher(row.getEmail()).matches()) {
                if (studentRepository.existsByEmailIdIgnoreCaseAndIsDeletedFalse(normalizedEmail)) {
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

        List<StudentImportRow> validRows = rows.stream()
                .filter(r -> !invalidRowNumbers.contains(r.getRowNumber()))
                .toList();

        BulkImportResponse saveResult = saveStudents(validRows);

        List<ImportErrorDto> combinedErrors = new ArrayList<>(allErrors);
        if (saveResult.getErrors() != null) {
            combinedErrors.addAll(saveResult.getErrors());
        }
        int totalInvalid = invalidRowNumbers.size()
                + (saveResult.getErrors() != null ? saveResult.getErrors().size() : 0);

        return BulkImportResponse.builder()
                .success(saveResult.getStudentsImported() > 0)
                .totalRows(rows.size())
                .validRows(rows.size() - totalInvalid)
                .invalidRows(totalInvalid)
                .studentsImported(saveResult.getStudentsImported())
                .guardiansCreated(saveResult.getGuardiansCreated() != null ? saveResult.getGuardiansCreated() : 0)
                .errors(combinedErrors.isEmpty() ? null : combinedErrors)
                .build();
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
                String rollNumber = getCellStringValue(row.getCell(22));
                String admissionType = getCellStringValue(row.getCell(23));
                String status = getCellStringValue(row.getCell(24));
                String remarks = getCellStringValue(row.getCell(25));
                String fatherName = getCellStringValue(row.getCell(26));
                String fatherOccupation = getCellStringValue(row.getCell(27));
                String fatherStatus = getCellStringValue(row.getCell(28));
                String motherName = getCellStringValue(row.getCell(29));
                String motherOccupation = getCellStringValue(row.getCell(30));
                String motherStatus = getCellStringValue(row.getCell(31));

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
                        .rollNumber(rollNumber)
                        .admissionType(admissionType)
                        .status(status)
                        .remarks(remarks)
                        .fatherName(fatherName)
                        .fatherOccupation(fatherOccupation)
                        .fatherStatus(fatherStatus)
                        .motherName(motherName)
                        .motherOccupation(motherOccupation)
                        .motherStatus(motherStatus)
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
        int studentsImported = 0;
        int guardiansCreated = 0;
        List<ImportErrorDto> saveErrors = new ArrayList<>();
        Map<String, Integer> guardianIdCache = new HashMap<>();
        Set<String> createdGuardianPhones = new HashSet<>();

        for (StudentImportRow row : rows) {
            try {
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

                Integer castleId = null;
                if (!row.getCaste().isEmpty()) {
                    castleId = casteRepository.findByCasteNameIgnoreCase(row.getCaste())
                            .map(CasteMaster::getCasteId)
                            .orElse(null);
                }

                Integer classId = classRepository.findByClassNameIgnoreCase(row.getClassName())
                        .map(ClassMaster::getClassId)
                        .orElseThrow(() -> new IllegalStateException("Class not found: " + row.getClassName()));

                Integer relationshipId = relationshipRepository.findByRelationshipNameIgnoreCase(row.getRelationship())
                        .map(RelationshipMaster::getRelationshipId)
                        .orElseThrow(() -> new IllegalStateException("Relationship not found: " + row.getRelationship()));

                String email = row.getEmail().toLowerCase();
                if (email.isEmpty()) {
                    email = row.getAadhaar() + "@saho-foundation.org";
                }

                // Build StudentRequestDto
                StudentRequestDto dto = new StudentRequestDto();
                dto.setFirstName(row.getFirstName());
                dto.setLastName(row.getLastName());
                dto.setEmailId(email);
                dto.setDob(LocalDate.parse(row.getDob(), DATE_FORMATTER));
                dto.setGender(resolveGenderValue(row.getGender()));
                dto.setAadhaarNumber(row.getAadhaar());
                dto.setCasteId(castleId);
                dto.setReligion(resolveReligionValue(row.getReligion()));
                dto.setBloodGroup(row.getBloodGroup().isEmpty() ? null : row.getBloodGroup());
                dto.setOrphanStatus(resolveOrphanStatusValue(row.getOrphanStatus()));
                dto.setSchId(school.getSchId());
                dto.setClassId(classId);
                dto.setImageUrl(null);
                dto.setCreatedBy(1);
                dto.setHasSibling(false);
                dto.setSiblingIds(null);

                // Parent mapping from explicit father/mother columns
                dto.setFatherName(row.getFatherName().isEmpty() ? null : row.getFatherName());
                dto.setFatherOccupation(row.getFatherOccupation().isEmpty() ? null : resolveParentOccupationValue(row.getFatherOccupation()));
                dto.setFatherStatus(row.getFatherStatus().isEmpty() ? null : resolveParentStatusValue(row.getFatherStatus()));
                dto.setMotherName(row.getMotherName().isEmpty() ? null : row.getMotherName());
                dto.setMotherOccupation(row.getMotherOccupation().isEmpty() ? null : resolveParentOccupationValue(row.getMotherOccupation()));
                dto.setMotherStatus(row.getMotherStatus().isEmpty() ? null : resolveParentStatusValue(row.getMotherStatus()));

                // Guardian: check if already resolved for this phone (reuse existing)
                String guardianPhone = row.getGuardianPhone();
                Integer existingGuardianId = guardianIdCache.get(guardianPhone);
                if (existingGuardianId == null) {
                    Guardian existingGuardian = guardianRepository.findByPhoneNumber(guardianPhone).orElse(null);
                    if (existingGuardian != null) {
                        existingGuardianId = existingGuardian.getGuardianId();
                    }
                    guardianIdCache.put(guardianPhone, existingGuardianId);
                }

                if (existingGuardianId != null) {
                    dto.setGuardianId(existingGuardianId);
                } else {
                    if (createdGuardianPhones.add(guardianPhone)) {
                        guardiansCreated++;
                    }
                    StudentRequestDto.GuardianRequestDto guardianDto = new StudentRequestDto.GuardianRequestDto();
                    guardianDto.setFirstName(row.getGuardianFirstName());
                    guardianDto.setLastName(row.getGuardianLastName());
                    guardianDto.setPhoneNumber(guardianPhone);
                    guardianDto.setRelationshipId(relationshipId);
                    guardianDto.setOcc(row.getOccupation().isEmpty() ? null : row.getOccupation());
                    guardianDto.setAddr(row.getAddress().isEmpty() ? null : row.getAddress());
                    dto.setGuardian(guardianDto);
                }

                // Academic details - resolve labels to enum codes
                String admissionType = resolveAdmissionTypeValue(row.getAdmissionType());
                String academicStatus = resolveAcademicStatusValue(row.getStatus());

                StudentAcademicRequestDto academicDetails = StudentAcademicRequestDto.builder()
                        .studentAcademicId(null)
                        .schoolId(school.getSchId())
                        .classId(classId)
                        .rollNumber(row.getRollNumber().isEmpty() ? null : row.getRollNumber())
                        .admissionType(admissionType)
                        .status(academicStatus)
                        .remarks(row.getRemarks().isEmpty() ? null : row.getRemarks())
                        .isActive(true)
                        .createdBy(1)
                        .build();
                dto.setAcademicDetails(academicDetails);

                // Handle soft-deleted student reactivation
                Optional<Student> existingSoftDeleted = studentRepository
                        .findByAadhaarNumber(row.getAadhaar())
                        .filter(s -> Boolean.TRUE.equals(s.getIsDeleted()));
                if (existingSoftDeleted.isPresent()) {
                    Student student = existingSoftDeleted.get();
                    student.setIsDeleted(false);
                    student.setFirstName(row.getFirstName());
                    student.setLastName(row.getLastName());
                    student.setEmailId(email);
                    student.setDob(LocalDate.parse(row.getDob(), DATE_FORMATTER));
                    student.setGender(resolveGenderValue(row.getGender()));
                    student.setAadhaarNumber(row.getAadhaar());
                    student.setCasteId(castleId);
                    student.setReligion(resolveReligionValue(row.getReligion()));
                    student.setBloodGroup(row.getBloodGroup().isEmpty() ? null : row.getBloodGroup());
                    student.setOrphanStatus(resolveOrphanStatusValue(row.getOrphanStatus()));
                    student = studentRepository.save(student);
                    assignDefaultSponsorByStudentId(student.getStudentId());
                    studentsImported++;
                    continue;
                }

                // Delegate to the Add Student service
                StudentResponseDto response = studentService.createStudent(dto);
                assignDefaultSponsorByStudentId(response.getStudentId());
                studentsImported++;

            } catch (Exception e) {
                log.error("Failed to import row {}: {}", row.getRowNumber(), e.getMessage(), e);
                saveErrors.add(ImportErrorDto.builder()
                        .row(row.getRowNumber())
                        .message("Failed to import: " + e.getMessage())
                        .build());
            }
        }

        return BulkImportResponse.builder()
                .success(studentsImported > 0)
                .studentsImported(studentsImported)
                .guardiansCreated(guardiansCreated)
                .errors(saveErrors.isEmpty() ? null : saveErrors)
                .build();
    }

    private void assignDefaultSponsorByStudentId(Integer studentId) {
        Sponsor defaultSponsor = sponsorRepository.findBySponsorNameIgnoreCase("SaHo Foundation")
                .orElse(null);
        if (defaultSponsor == null) {
            log.warn("Default sponsor 'SaHo Foundation' not found. Skipping sponsor assignment.");
            return;
        }
        Optional<StudentSponsor> existingMapping = studentSponsorRepository
                .findByStudentIdAndSponsorIdAndIsActiveTrue(studentId, defaultSponsor.getSponsorId());
        if (existingMapping.isEmpty()) {
            StudentSponsor studentSponsor = StudentSponsor.builder()
                    .studentId(studentId)
                    .sponsorId(defaultSponsor.getSponsorId())
                    .isActive(true)
                    .isDeleted(false)
                    .createdAt(java.time.LocalDate.now())
                    .build();
            studentSponsorRepository.save(studentSponsor);
        }
    }

    private String resolveParentStatusValue(String input) {
        if (input == null || input.isEmpty()) return null;
        ParentStatus resolved = ParentStatus.fromLabel(input);
        if (resolved != null) return resolved.getValue();
        try {
            return ParentStatus.fromValue(input).getValue();
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private String resolveParentOccupationValue(String input) {
        if (input == null || input.isEmpty()) return null;
        for (ParentOccupation occ : ParentOccupation.values()) {
            if (occ.getLabel().equalsIgnoreCase(input) || occ.getValue().equals(input)) {
                return occ.getValue();
            }
        }
        return input;
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

    private String resolveAdmissionTypeValue(String input) {
        if (input == null || input.isEmpty()) return "1";
        AdmissionType resolved = AdmissionType.fromLabel(input);
        if (resolved != null) return resolved.getValue();
        try {
            return AdmissionType.fromValue(input).getValue();
        } catch (IllegalArgumentException e) {
            return "1";
        }
    }

    private String resolveAcademicStatusValue(String input) {
        if (input == null || input.isEmpty()) return "1";
        StudentAcademicStatus resolved = StudentAcademicStatus.fromLabel(input);
        if (resolved != null) return resolved.getValue();
        try {
            return StudentAcademicStatus.fromValue(input).getValue();
        } catch (IllegalArgumentException e) {
            return "1";
        }
    }
}
