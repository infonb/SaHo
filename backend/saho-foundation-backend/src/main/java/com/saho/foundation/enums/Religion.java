package com.saho.foundation.enums;

public enum Religion {

    HINDU("1", "Hindu"),
    MUSLIM("2", "Muslim"),
    CHRISTIAN("3", "Christian"),
    BUDDHIST("4", "Buddhist"),
    JAIN("5", "Jain"),
    SIKH("6", "Sikh"),
    OTHER("7", "Other");

    private final String value;
    private final String label;

    Religion(String value, String label) {
        this.value = value;
        this.label = label;
    }

    public String getValue() {
        return value;
    }

    public String getLabel() {
        return label;
    }

    public static Religion fromValue(String value) {
        for (Religion religion : values()) {
            if (religion.value.equals(value)) {
                return religion;
            }
        }
        throw new IllegalArgumentException("Invalid religion value: " + value);
    }

    public static String getLabelByValue(String value) {
        for (Religion religion : values()) {
            if (religion.value.equals(value)) {
                return religion.label;
            }
        }
        return null;
    }

    public static Religion fromLabel(String label) {
        for (Religion religion : values()) {
            if (religion.label.equalsIgnoreCase(label)) {
                return religion;
            }
        }
        return null;
    }
}
