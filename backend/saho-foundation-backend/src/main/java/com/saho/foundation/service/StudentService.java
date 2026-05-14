package com.saho.foundation.service;

import com.saho.foundation.dto.StudentDto;
import com.saho.foundation.entity.Student;
import com.saho.foundation.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class StudentService {

    @Autowired
    private StudentRepository studentRepository;

    public Student createStudent(StudentDto dto) {

        Student student = Student.builder()
                .firstName(dto.getFirstName())
                .middleName(dto.getMiddleName())
                .lastName(dto.getLastName())
                .emailId(dto.getEmailId())
                .dob(dto.getDob())
                .gender(dto.getGender())
                .aadhaarNumber(dto.getAadhaarNumber())
                .caste(dto.getCaste())
                .religion(dto.getReligion())
                .bloodGroup(dto.getBloodGroup())
                .schId(dto.getSchId())
                .classId(dto.getClassId())
                .guardianId(dto.getGuardianId())
                .orphanStatus(dto.getOrphanStatus())
                .imageUrl(dto.getImageUrl())
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(dto.getCreatedBy())
                .build();

        return studentRepository.save(student);
    }
}