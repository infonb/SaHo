package com.saho.foundation.service.iservices;

import com.saho.foundation.dto.ReminderFilterDto;
import com.saho.foundation.dto.ReminderRequestDto;
import com.saho.foundation.dto.ReminderResponseDto;

import java.util.List;

public interface ReminderService {
    List<ReminderResponseDto> getRemindersAdmin(ReminderFilterDto filter);

    ReminderResponseDto getReminderAdminById(Integer remId);

    Integer createOrUpdateReminder(ReminderRequestDto requestDto);

    void deleteReminder(Integer remId);

    void cancelReminder(Integer remId, Integer updatedBy);

    List<ReminderResponseDto> getStudentReminders(Integer studentId);
}
