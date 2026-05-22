package com.saho.foundation.enums;

public enum Gender {

    MALE("1", "Male"),
    FEMALE("2", "Female"),
    OTHER("3", "Other");

    private final String value;
    private final String label;

    Gender(String value, String label) {
        this.value = value;
        this.label = label;
    }

    public String getValue() {
        return value;
    }

    public String getLabel() {
        return label;
    }

    public static Gender fromValue(String value) {
        for (Gender gender : values()) {
            if (gender.value.equals(value)) {
                return gender;
            }
        }
        throw new IllegalArgumentException("Invalid gender value: " + value);
    }

    public static String getLabelByValue(String value) {
        for (Gender gender : values()) {
            if (gender.value.equals(value)) {
                return gender.label;
            }
        }
        return null;
    }
}
