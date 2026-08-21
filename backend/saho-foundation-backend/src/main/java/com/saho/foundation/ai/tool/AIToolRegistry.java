package com.saho.foundation.ai.tool;

import com.saho.foundation.ai.dto.IntentDTO;
import com.saho.foundation.ai.exception.AIProcessingException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;

@Service
public class AIToolRegistry {

    private final List<AITool> tools;

    public AIToolRegistry(List<AITool> tools) {
        this.tools = List.copyOf(tools);
    }

    public Optional<AITool> findTool(IntentDTO intent) {
        return tools.stream()
            .filter(tool -> tool.supports(intent))
            .findFirst();
    }

    public AITool resolve(IntentDTO intent) {
        if (intent == null) {
            throw new AIProcessingException("Intent is required");
        }

        if (!StringUtils.hasText(intent.getModule()) || !StringUtils.hasText(intent.getAction())) {
            throw new AIProcessingException("Intent module and action are required");
        }

        return findTool(intent)
            .orElseThrow(() -> new AIProcessingException(
                "No AI tool registered for module='" + intent.getModule() + "', action='" + intent.getAction() + "'"
            ));
    }

    public List<AITool> tools() {
        return tools;
    }
}
