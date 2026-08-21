package com.saho.foundation.ai.service;

import com.saho.foundation.ai.dto.IntentDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@Slf4j
@Service
public class ConversationMemoryService {

    private static final Duration TTL = Duration.ofMinutes(30);
    private static final Pattern FOLLOW_UP_HINT = Pattern.compile(
        "\\b(them|those|these|same|again|also|only|more|ones|one|it|that|this|their|his|her)\\b",
        Pattern.CASE_INSENSITIVE
    );

    private final Map<String, ConversationState> sessions = new ConcurrentHashMap<>();

    public Optional<IntentDTO> applyContext(String sessionId, String userMessage, IntentDTO currentIntent) {
        if (!StringUtils.hasText(sessionId) || currentIntent == null) {
            return Optional.ofNullable(currentIntent);
        }

        ConversationState previousState = getState(sessionId).orElse(null);
        if (previousState == null || previousState.lastIntent() == null) {
            return Optional.of(currentIntent);
        }

        IntentDTO previousIntent = previousState.lastIntent();
        if (!canMerge(previousIntent, currentIntent, userMessage)) {
            return Optional.of(currentIntent);
        }

        IntentDTO merged = merge(previousIntent, currentIntent);
        log.info(
            "Merged conversation context for sessionId='{}' using previous module='{}', action='{}'",
            sessionId,
            previousIntent.getModule(),
            previousIntent.getAction()
        );
        return Optional.of(merged);
    }

    public void remember(String sessionId, String userMessage, IntentDTO intent) {
        if (!StringUtils.hasText(sessionId) || intent == null) {
            return;
        }

        sessions.put(sessionId, new ConversationState(copyIntent(intent), normalizeMessage(userMessage), Instant.now()));
    }

    public Optional<IntentDTO> getLastIntent(String sessionId) {
        return getState(sessionId).map(ConversationState::lastIntent);
    }

    public void clear(String sessionId) {
        if (StringUtils.hasText(sessionId)) {
            sessions.remove(sessionId);
        }
    }

    private Optional<ConversationState> getState(String sessionId) {
        if (!StringUtils.hasText(sessionId)) {
            return Optional.empty();
        }

        ConversationState state = sessions.get(sessionId);
        if (state == null) {
            return Optional.empty();
        }

        if (Instant.now().minus(TTL).isAfter(state.updatedAt())) {
            sessions.remove(sessionId);
            return Optional.empty();
        }

        return Optional.of(state);
    }

    private boolean canMerge(IntentDTO previousIntent, IntentDTO currentIntent, String userMessage) {
        if (previousIntent == null || currentIntent == null) {
            return false;
        }

        if (!StringUtils.hasText(previousIntent.getModule()) || !StringUtils.hasText(currentIntent.getModule())) {
            return false;
        }

        if (!StringUtils.hasText(userMessage)) {
            return false;
        }

        String normalized = normalizeMessage(userMessage);
        boolean followUpHint = FOLLOW_UP_HINT.matcher(normalized).find();
        boolean hasExplicitCurrentModuleMention = hasExplicitModuleMention(normalized, currentIntent.getModule());
        boolean hasExplicitPreviousModuleMention = hasExplicitModuleMention(normalized, previousIntent.getModule());

        if (!previousIntent.getModule().equalsIgnoreCase(currentIntent.getModule())) {
            boolean exportFollowUp = "export".equalsIgnoreCase(currentIntent.getAction()) && followUpHint;
            if (!exportFollowUp) {
                return false;
            }

            return !hasExplicitCurrentModuleMention || hasExplicitPreviousModuleMention;
        }

        return followUpHint || !hasExplicitCurrentModuleMention;
    }

    private boolean hasExplicitModuleMention(String normalizedMessage, String module) {
        if (!StringUtils.hasText(normalizedMessage) || !StringUtils.hasText(module)) {
            return false;
        }

        return switch (module.toLowerCase(Locale.ROOT)) {
            case "students" -> normalizedMessage.matches(".*\\bstudents?\\b.*");
            case "sponsors" -> normalizedMessage.matches(".*\\bsponsors?\\b.*");
            case "schools" -> normalizedMessage.matches(".*\\bschools?\\b.*");
            case "reminders" -> normalizedMessage.matches(".*\\breminders?\\b.*");
            case "dashboard" -> normalizedMessage.matches(".*\\bdashboard\\b.*");
            case "reports" -> normalizedMessage.matches(".*\\breports?\\b.*");
            case "location" -> normalizedMessage.matches(".*\\blocation\\b.*");
            default -> false;
        };
    }

    private IntentDTO merge(IntentDTO previousIntent, IntentDTO currentIntent) {
        Map<String, Object> mergedFilters = new LinkedHashMap<>();
        if (previousIntent.getFilters() != null) {
            mergedFilters.putAll(previousIntent.getFilters());
        }
        if (currentIntent.getFilters() != null) {
            mergedFilters.putAll(currentIntent.getFilters());
        }

        String resolvedModule = resolveMergedModule(previousIntent, currentIntent);

        return IntentDTO.builder()
            .module(resolvedModule)
            .action(StringUtils.hasText(currentIntent.getAction()) ? currentIntent.getAction() : previousIntent.getAction())
            .filters(mergedFilters)
            .responseType(StringUtils.hasText(currentIntent.getResponseType()) ? currentIntent.getResponseType() : previousIntent.getResponseType())
            .reportType(StringUtils.hasText(currentIntent.getReportType()) ? currentIntent.getReportType() : previousIntent.getReportType())
            .build();
    }

    private String resolveMergedModule(IntentDTO previousIntent, IntentDTO currentIntent) {
        if (!StringUtils.hasText(currentIntent.getModule())) {
            return previousIntent.getModule();
        }

        if (!StringUtils.hasText(previousIntent.getModule())) {
            return currentIntent.getModule();
        }

        if ("export".equalsIgnoreCase(currentIntent.getAction())
            && !previousIntent.getModule().equalsIgnoreCase(currentIntent.getModule())) {
            return previousIntent.getModule();
        }

        return currentIntent.getModule();
    }

    private IntentDTO copyIntent(IntentDTO intent) {
        Map<String, Object> filters = new LinkedHashMap<>();
        if (intent.getFilters() != null) {
            filters.putAll(intent.getFilters());
        }

        return IntentDTO.builder()
            .module(intent.getModule())
            .action(intent.getAction())
            .filters(filters)
            .responseType(intent.getResponseType())
            .reportType(intent.getReportType())
            .build();
    }

    private String normalizeMessage(String message) {
        return message == null ? "" : message.trim().toLowerCase(Locale.ROOT);
    }

    private record ConversationState(IntentDTO lastIntent, String lastUserMessage, Instant updatedAt) {
    }
}
