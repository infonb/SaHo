package com.saho.foundation.enums;

public enum OrphanStatus {

    NONE("1", "None"),
    SINGLE_PARENT("2", "Single Parent"),
    ORPHAN("3", "Orphan");

    private final String value;
    private final String label;

    OrphanStatus(String value, String label) {
        this.value = value;
        this.label = label;
    }

    public String getValue() {
        return value;
    }

    public String getLabel() {
        return label;
    }

    public static OrphanStatus fromValue(String value) {
        for (OrphanStatus orphanStatus : values()) {
            if (orphanStatus.value.equals(value)) {
                return orphanStatus;
            }
        }
        throw new IllegalArgumentException("Invalid orphanStatus value: " + value);
    }

    public static String getLabelByValue(String value) {
        for (OrphanStatus orphanStatus : values()) {
            if (orphanStatus.value.equals(value)) {
                return orphanStatus.label;
            }
        }
        return null;
    }
}
