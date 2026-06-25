package com.saho.foundation.repository;

import com.saho.foundation.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByEmailId(String emailId);

    Optional<User> findByStudentId(Integer studentId);

    List<User> findByRoleAndIsDeleted(String role, Boolean isDeleted);

    long countByRoleAndIsDeleted(String role, Boolean isDeleted);
}
