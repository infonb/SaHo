package com.saho.foundation.controller;

import com.saho.foundation.dto.ReminderRequestDto;
import com.saho.foundation.dto.ReminderResponseDto;
import com.saho.foundation.dto.ReminderCancelRequestDto;
import com.saho.foundation.service.iservices.ReminderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reminders")
@RequiredArgsConstructor
public class ReminderController {

    private final ReminderService reminderService;

    @GetMapping
    public List<ReminderResponseDto> getRemindersAdmin() {
        return reminderService.getRemindersAdmin();
    }

    @GetMapping("/{remId}")
    public ReminderResponseDto getReminderById(@PathVariable Integer remId) {
        return reminderService.getReminderAdminById(remId);
    }

    @PostMapping
    public Integer createReminder(@RequestBody ReminderRequestDto requestDto) {
        requestDto.setRemId(0);
        return reminderService.createOrUpdateReminder(requestDto);
    }

    @PutMapping("/{remId}")
    public Integer updateReminder(@PathVariable Integer remId, @RequestBody ReminderRequestDto requestDto) {
        requestDto.setRemId(remId);
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
}
