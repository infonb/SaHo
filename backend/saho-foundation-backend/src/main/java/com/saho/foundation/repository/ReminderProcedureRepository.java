package com.saho.foundation.repository;

import com.saho.foundation.dto.ReminderFilterDto;
import com.saho.foundation.dto.ReminderRequestDto;
import com.saho.foundation.dto.ReminderResponseDto;

import java.util.List;

public interface ReminderProcedureRepository {
    List<ReminderResponseDto> getRemindersAdmin(ReminderFilterDto filter);

    ReminderResponseDto getReminderAdminById(Integer remId);

    Integer createOrUpdateReminderAndAssign(ReminderRequestDto requestDto);

    void deleteReminder(Integer remId);

    void cancelReminder(Integer remId, Integer updatedBy);
}
