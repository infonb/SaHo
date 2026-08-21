package com.saho.foundation.ai.tool;

import com.saho.foundation.ai.dto.ChatResponse;
import com.saho.foundation.ai.dto.IntentDTO;
import com.saho.foundation.ai.exception.AIProcessingException;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AIToolRegistryTest {

    @Test
    void resolvesMatchingToolByModuleAndAction() {
        AITool searchTool = new TestTool("students", "search");
        AITool countTool = new TestTool("students", "count");
        AIToolRegistry registry = new AIToolRegistry(List.of(searchTool, countTool));

        AITool resolved = registry.resolve(
            IntentDTO.builder()
                .module("students")
                .action("count")
                .filters(Map.of())
                .build()
        );

        assertEquals("student.count", resolved.toolName());
        assertEquals("count", resolved.action());
    }

    @Test
    void throwsWhenNoToolMatchesIntent() {
        AIToolRegistry registry = new AIToolRegistry(List.of(new TestTool("students", "search")));

        assertThrows(AIProcessingException.class, () ->
            registry.resolve(
                IntentDTO.builder()
                    .module("sponsors")
                    .action("search")
                    .filters(Map.of())
                    .build()
            )
        );
    }

    private static final class TestTool implements AITool {
        private final String module;
        private final String action;

        private TestTool(String module, String action) {
            this.module = module;
            this.action = action;
        }

        @Override
        public String module() {
            return module;
        }

        @Override
        public String action() {
            return action;
        }

        @Override
        public String toolName() {
            return "student." + action;
        }

        @Override
        public String description() {
            return "Test tool";
        }

        @Override
        public ChatResponse execute(IntentDTO intent, String userMessage) {
            return new ChatResponse();
        }
    }
}
