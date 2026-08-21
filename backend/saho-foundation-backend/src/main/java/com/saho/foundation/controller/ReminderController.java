package com.saho.foundation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.saho.foundation.dto.ReminderFilterDto;
import com.saho.foundation.dto.ReminderRequestDto;
import com.saho.foundation.dto.ReminderResponseDto;
import com.saho.foundation.dto.ReminderCancelRequestDto;
import com.saho.foundation.security.SecurityUtil;
import com.saho.foundation.service.iservices.ReminderService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/reminders")
@RequiredArgsConstructor
public class ReminderController {

    private static final Logger log = LoggerFactory.getLogger(ReminderController.class);
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private final ReminderService reminderService;
    private final ObjectMapper objectMapper;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @GetMapping
    public List<ReminderResponseDto> getRemindersAdmin(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer pageNumber,
            @RequestParam(required = false) Integer pageSize,
            @RequestParam(required = false) String stateIdsCsv,
            @RequestParam(required = false) String distIdsCsv,
            @RequestParam(required = false) String mndlIdsCsv,
            @RequestParam(required = false) String vilIdsCsv,
            @RequestParam(required = false) String schIdsCsv,
            @RequestParam(required = false) String status) {
        ReminderFilterDto filter = ReminderFilterDto.builder()
                .search(search)
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .stateIdsCsv(stateIdsCsv)
                .distIdsCsv(distIdsCsv)
                .mndlIdsCsv(mndlIdsCsv)
                .vilIdsCsv(vilIdsCsv)
                .schIdsCsv(schIdsCsv)
                .status(status)
                .build();
        return reminderService.getRemindersAdmin(filter);
    }

    @GetMapping("/student/{studentId}")
    public List<ReminderResponseDto> getStudentReminders(@PathVariable Integer studentId) {
        String role = SecurityUtil.getCurrentRole();
        Integer tokenStudentId = SecurityUtil.getCurrentStudentId();
        log.info("GET /api/reminders/student/{} - role={}, tokenStudentId={}", studentId, role, tokenStudentId);
        SecurityUtil.checkStudentOwnership(studentId);
        return reminderService.getStudentReminders(studentId);
    }

    @GetMapping("/{remId}")
    public ReminderResponseDto getReminderById(@PathVariable Integer remId) {
        return reminderService.getReminderAdminById(remId);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public Integer createReminder(@RequestBody ReminderRequestDto requestDto) {
        requestDto.setRemId(0);
        return reminderService.createOrUpdateReminder(requestDto);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Integer createReminderWithImage(
            @RequestParam("request") String requestJson,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) throws IOException {
        ReminderRequestDto requestDto = readReminderRequest(requestJson);
        requestDto.setRemId(0);
        if (image != null && !image.isEmpty()) {
            requestDto.setBannerImage(saveReminderImage(image));
        }
        return reminderService.createOrUpdateReminder(requestDto);
    }

    @PutMapping(value = "/{remId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Integer updateReminder(@PathVariable Integer remId, @RequestBody ReminderRequestDto requestDto) {
        requestDto.setRemId(remId);
        return reminderService.createOrUpdateReminder(requestDto);
    }

    @PutMapping(value = "/{remId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Integer updateReminderWithImage(
            @PathVariable Integer remId,
            @RequestParam("request") String requestJson,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) throws IOException {
        ReminderRequestDto requestDto = readReminderRequest(requestJson);
        requestDto.setRemId(remId);
        if (image != null && !image.isEmpty()) {
            requestDto.setBannerImage(saveReminderImage(image));
        }
        return reminderService.createOrUpdateReminder(requestDto);
    }

    @DeleteMapping("/{remId}")
    public String deleteReminder(@PathVariable Integer remId) {
        reminderService.deleteReminder(remId);
        return "Reminder soft deleted successfully";
    }

    @PutMapping("/{remId}/cancel")
    public String cancelReminder(@PathVariable Integer remId, @RequestBody(required = false) ReminderCancelRequestDto requestDto) {
        Integer updatedBy = requestDto != null ? requestDto.getUpdatedBy() : null;
        reminderService.cancelReminder(remId, updatedBy);
        return "Reminder cancelled successfully";
    }

    private ReminderRequestDto readReminderRequest(String requestJson) {
        try {
            return objectMapper.readValue(requestJson, ReminderRequestDto.class);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid event request data", ex);
        }
    }

    private String saveReminderImage(MultipartFile file) throws IOException {
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Only JPG, PNG, and WEBP event images are allowed");
        }

        String extension = switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };

        Path eventUploadDir = Paths.get(uploadDir, "events").toAbsolutePath().normalize();
        Files.createDirectories(eventUploadDir);

        String fileName = "event-" + UUID.randomUUID() + extension;
        Path targetPath = eventUploadDir.resolve(fileName).normalize();
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        return "/uploads/events/" + fileName;
    }
}
