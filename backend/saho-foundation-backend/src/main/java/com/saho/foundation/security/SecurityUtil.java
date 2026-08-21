package com.saho.foundation.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtil {

    private static final Logger log = LoggerFactory.getLogger(SecurityUtil.class);

    private SecurityUtil() {}

    public static Integer getCurrentUserId() {
        String principal = getPrincipal();
        if (principal == null) return null;
        String[] parts = principal.split(":");
        try {
            return parts.length >= 1 ? Integer.parseInt(parts[0]) : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public static String getCurrentRole() {
        String principal = getPrincipal();
        if (principal == null) return null;
        String[] parts = principal.split(":");
        return parts.length >= 2 ? parts[1] : null;
    }

    public static Integer getCurrentStudentId() {
        String principal = getPrincipal();
        if (principal == null) return null;
        String[] parts = principal.split(":");
        if (parts.length >= 3 && !parts[2].isEmpty()) {
            try {
                return Integer.parseInt(parts[2]);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    public static void checkStudentOwnership(Integer requestedStudentId) {
        String role = getCurrentRole();
        if ("ADMIN".equalsIgnoreCase(role)) {
            log.debug("Ownership check SKIPPED for ADMIN, requestedStudentId={}", requestedStudentId);
            return;
        }
        Integer tokenStudentId = getCurrentStudentId();
        log.debug("Ownership check: tokenStudentId={}, requestedStudentId={}", tokenStudentId, requestedStudentId);
        if (tokenStudentId == null || !tokenStudentId.equals(requestedStudentId)) {
            log.warn("Access DENIED: student token has studentId={} but requested studentId={}",
                    tokenStudentId, requestedStudentId);
            throw new org.springframework.security.access.AccessDeniedException(
                    "Access denied: you can only access your own data");
        }
        log.debug("Ownership check PASSED for studentId={}", requestedStudentId);
    }

    private static String getPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            log.warn("No authenticated principal found in SecurityContext");
            return null;
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof String) {
            return (String) principal;
        }
        log.warn("Unexpected principal type: {}", principal != null ? principal.getClass() : "null");
        return null;
    }
}
