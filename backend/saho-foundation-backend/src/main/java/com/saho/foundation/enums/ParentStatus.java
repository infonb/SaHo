package com.saho.foundation.enums;

public enum ParentStatus {

    ALIVE("1", "Alive"),
    DECEASED("2", "Deceased"),
    ABANDONED("3", "Abandoned"),
    SEPARATED("4", "Separated"),
    DIVORCED("5", "Divorced"),
    MISSING("6", "Missing"),
    UNKNOWN("7", "Unknown");

    private final String value;
    private final String label;

    ParentStatus(String value, String label) {
        this.value = value;
        this.label = label;
    }

    public String getValue() {
        return value;
    }

    public String getLabel() {
        return label;
    }

    public static ParentStatus fromValue(String value) {
        for (ParentStatus parentStatus : values()) {
            if (parentStatus.value.equals(value)) {
                return parentStatus;
            }
        }
        throw new IllegalArgumentException("Invalid parent status value: " + value);
    }

    public static String getLabelByValue(String value) {
        for (ParentStatus parentStatus : values()) {
            if (parentStatus.value.equals(value)) {
                return parentStatus.label;
            }
        }
        return null;
    }

    public static ParentStatus fromLabel(String label) {
        if (label == null) {
            return null;
        }
        for (ParentStatus parentStatus : values()) {
            if (parentStatus.label.equalsIgnoreCase(label)) {
                return parentStatus;
            }
        }
        return null;
    }
}
