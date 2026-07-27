package com.saho.foundation.enums;

public enum StudentAcademicStatus {

    ACTIVE("1", "Active"),
    COMPLETED("2", "Completed"),
    TRANSFERRED("3", "Transferred"),
    DROPPED("4", "Dropped");

    private final String value;
    private final String label;

    StudentAcademicStatus(String value, String label) {
        this.value = value;
        this.label = label;
    }

    public String getValue() {
        return value;
    }

    public String getLabel() {
        return label;
    }

    public static StudentAcademicStatus fromLabel(String label) {
        if (label == null) return null;
        for (StudentAcademicStatus s : values()) {
            if (s.label.equalsIgnoreCase(label)) return s;
        }
        return null;
    }

    public static StudentAcademicStatus fromValue(String value) {
        for (StudentAcademicStatus s : values()) {
            if (s.value.equals(value)) return s;
        }
        throw new IllegalArgumentException("Invalid StudentAcademicStatus value: " + value);
    }
}
