package com.saho.foundation.security;

import com.saho.foundation.entity.User;
import com.saho.foundation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        String normalized = username.trim().toLowerCase();
        User user = userRepository.findByEmailIdIgnoreCase(normalized).orElse(null);
        if (user == null) {
            try {
                Integer studentId = Integer.parseInt(username);
                user = userRepository.findByStudentId(studentId)
                        .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
            } catch (NumberFormatException e) {
                throw new UsernameNotFoundException("User not found with username: " + username);
            }
        }
        return buildUserDetails(user);
    }

    public UserDetails loadUserByStudentId(Integer studentId) {
        User user = userRepository.findByStudentId(studentId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with student ID: " + studentId));

        return buildUserDetails(user);
    }

    private UserDetails buildUserDetails(User user) {
        return new org.springframework.security.core.userdetails.User(
                user.getEmailId() != null ? user.getEmailId().toLowerCase() : String.valueOf(user.getStudentId()),
                user.getPassword(),
                true,
                true, true, true,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().toUpperCase()))
        );
    }
}
