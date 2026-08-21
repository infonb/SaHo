package com.saho.foundation.ai.exception;

import com.saho.foundation.ai.dto.AIErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice(basePackages = "com.saho.foundation.ai")
public class AIExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(AIExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<AIErrorResponse> handleValidation(
        MethodArgumentNotValidException ex,
        HttpServletRequest request
    ) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        String message = fieldErrors.values().stream().findFirst().orElse("Validation failed");
        log.warn("AI request validation failed for {}: {}", request.getRequestURI(), fieldErrors);
        return buildResponse(HttpStatus.BAD_REQUEST, message, request.getRequestURI());
    }

    @ExceptionHandler(AIProcessingException.class)
    public ResponseEntity<AIErrorResponse> handleAiProcessing(
        AIProcessingException ex,
        HttpServletRequest request
    ) {
        log.error("AI processing error for {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<AIErrorResponse> handleIllegalArgument(
        IllegalArgumentException ex,
        HttpServletRequest request
    ) {
        log.warn("AI bad request for {}: {}", request.getRequestURI(), ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<AIErrorResponse> handleGeneric(
        Exception ex,
        HttpServletRequest request
    ) {
        log.error("Unexpected AI error for {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        return buildResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "Unexpected AI backend error",
            request.getRequestURI()
        );
    }

    private ResponseEntity<AIErrorResponse> buildResponse(HttpStatus status, String message, String path) {
        return ResponseEntity.status(status).body(
            new AIErrorResponse(LocalDateTime.now(), status.value(), message, path)
        );
    }
}
