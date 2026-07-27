package com.saho.foundation.enums;

public enum AdmissionType {

    NEW("1", "New"),
    PROMOTED("2", "Promoted"),
    TRANSFER("3", "Transfer"),
    READMISSION("4", "Readmission");

    private final String value;
    private final String label;

    AdmissionType(String value, String label) {
        this.value = value;
        this.label = label;
    }

    public String getValue() {
        return value;
    }

    public String getLabel() {
        return label;
    }

    public static AdmissionType fromLabel(String label) {
        if (label == null) return null;
        for (AdmissionType at : values()) {
            if (at.label.equalsIgnoreCase(label)) return at;
        }
        return null;
    }

    public static AdmissionType fromValue(String value) {
        for (AdmissionType at : values()) {
            if (at.value.equals(value)) return at;
        }
        throw new IllegalArgumentException("Invalid AdmissionType value: " + value);
    }
}
