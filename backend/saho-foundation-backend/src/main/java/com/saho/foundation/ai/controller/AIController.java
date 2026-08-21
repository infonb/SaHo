package com.saho.foundation.ai.controller;

import com.saho.foundation.ai.dto.ChatRequest;
import com.saho.foundation.ai.dto.ChatResponse;
import com.saho.foundation.ai.service.AIService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@Valid @RequestBody ChatRequest request) {
        log.info("Incoming AI chat request");
        ChatResponse response = aiService.processMessage(request.getMessage(), request.getSessionId());
        return ResponseEntity.ok(response);
    }
}
