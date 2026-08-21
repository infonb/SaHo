package com.saho.foundation.ai.handler.analytics.graph;

import com.saho.foundation.ai.dto.ChatResponse;
import com.saho.foundation.ai.dto.IntentDTO;
import com.saho.foundation.ai.handler.analytics.AnalyticsAction;
import com.saho.foundation.ai.service.ResponseBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class GraphAnalyticsAction implements AnalyticsAction {

    private final GraphQuerySupport graphQuerySupport;
    private final GraphAnalyticsService graphAnalyticsService;
    private final ResponseBuilder responseBuilder;

    @Override
    public boolean supports(String action) {
        return "graph".equalsIgnoreCase(action)
            || "analytics".equalsIgnoreCase(action)
            || "report".equalsIgnoreCase(action);
    }

    @Override
    public String action() {
        return "graph";
    }

    @Override
    public ChatResponse handle(IntentDTO intent, String userMessage) {
        long startedAt = System.nanoTime();
        Map<String, Object> filters = intent != null && intent.getFilters() != null ? intent.getFilters() : Map.of();

        try {
            GraphQuerySupport.GraphActionContext context = graphQuerySupport.buildActionContext(filters, userMessage);
            log.info("Executing graph analytics for userMessage='{}', context={}", userMessage, context);

            if ("unknown".equalsIgnoreCase(context.datasetKey())) {
                return responseBuilder.text("I'm sorry, I don't support that analytics query yet.");
            }

            GraphAnalyticsService.GraphResult graphResult = graphAnalyticsService.buildGraph(context);
            ChatResponse response = responseBuilder.graph(
                graphResult.title(),
                graphResult.toMap(),
                "Here is the analytics view for " + graphResult.title().toLowerCase()
            );
            log.info("GraphAnalyticsAction final response: {}", response);
            return response;
        } catch (Exception ex) {
            log.error("Graph analytics failed for userMessage='{}'", userMessage, ex);
            return responseBuilder.text("I couldn't generate that analytics view.");
        } finally {
            long elapsedMs = (System.nanoTime() - startedAt) / 1_000_000;
            log.info("Graph analytics action execution time: {} ms for userMessage='{}'", elapsedMs, userMessage);
        }
    }
}
