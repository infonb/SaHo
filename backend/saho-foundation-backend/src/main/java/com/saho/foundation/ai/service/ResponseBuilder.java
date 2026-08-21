package com.saho.foundation.ai.service;

import com.saho.foundation.ai.dto.ChatResponse;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Map;
import java.util.List;

@Service
public class ResponseBuilder {

    public ChatResponse text(String message) {
        ChatResponse response = new ChatResponse();
        response.setType("text");
        response.setMessage(message);
        return response;
    }

    public ChatResponse table(String title, List<String> columns, List<List<String>> rows) {
        ChatResponse response = new ChatResponse();
        response.setType("table");
        response.setTitle(title);
        response.setColumns(columns);
        response.setRows(rows);
        return response;
    }

    public ChatResponse card(String title, Map<String, Object> data) {
        ChatResponse response = new ChatResponse();
        response.setType("card");
        response.setTitle(title);
        response.setData(data);
        return response;
    }

    public ChatResponse download(String title, Map<String, Object> data, String message) {
        ChatResponse response = new ChatResponse();
        response.setType("download");
        response.setTitle(title);
        response.setData(data);
        response.setMessage(message);
        return response;
    }

    public ChatResponse graph(String title, Map<String, Object> data, String message) {
        ChatResponse response = new ChatResponse();
        response.setType("graph");
        response.setTitle(title);
        response.setData(data);
        response.setMessage(message);
        return response;
    }

    public ChatResponse unknownModule(String module) {
        if (StringUtils.hasText(module)) {
            return text("I'm sorry, I don't support the " + module.trim() + " module yet.");
        }
        return text("I'm sorry, I couldn't understand that request.");
    }

    public ChatResponse unsupportedStudentQuery() {
        return text("I'm sorry, I don't support that student query yet.");
    }

    public ChatResponse studentLookupFailure() {
        return text("I couldn't retrieve student information.");
    }

    public ChatResponse unsupportedSponsorQuery() {
        return text("I'm sorry, I don't support that sponsor query yet.");
    }

    public ChatResponse sponsorLookupFailure() {
        return text("I couldn't retrieve sponsor information.");
    }

    public ChatResponse studentCount(long count, String label) {
        return text("There are " + count + " " + label + ".");
    }

    public ChatResponse greeting() {
        return text("""
            Hello! \uD83D\uDC4B

            I'm SAHO AI Assistant.

            I can help you with:

            \u2022 Students
            \u2022 Sponsors
            \u2022 Schools
            \u2022 Reminders
            \u2022 Dashboard
            \u2022 Reports

            How can I help you today?""");
    }
}
