package com.saho.foundation.service.impl;

import com.saho.foundation.dto.ReminderFilterDto;
import com.saho.foundation.dto.ReminderRequestDto;
import com.saho.foundation.dto.ReminderResponseDto;
import com.saho.foundation.repository.ReminderProcedureRepository;
import com.saho.foundation.service.iservices.ReminderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReminderServiceImpl implements ReminderService {

    private final ReminderProcedureRepository reminderProcedureRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ReminderResponseDto> getRemindersAdmin(ReminderFilterDto filter) {
        return reminderProcedureRepository.getRemindersAdmin(filter);
    }

    @Override
    @Transactional(readOnly = true)
    public ReminderResponseDto getReminderAdminById(Integer remId) {
        return reminderProcedureRepository.getReminderAdminById(remId);
    }

    @Override
    @Transactional
    public Integer createOrUpdateReminder(ReminderRequestDto requestDto) {
        return reminderProcedureRepository.createOrUpdateReminderAndAssign(requestDto);
    }

    @Override
    @Transactional
    public void deleteReminder(Integer remId) {
        reminderProcedureRepository.deleteReminder(remId);
    }

    @Override
    @Transactional
    public void cancelReminder(Integer remId, Integer updatedBy) {
        reminderProcedureRepository.cancelReminder(remId, updatedBy);
    }
}
