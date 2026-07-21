package com.saho.foundation.enums;

public enum ParentOccupation {

    FARMER("1", "Farmer"),
    DRIVER("2", "Driver"),
    MASON("3", "Mason"),
    CARPENTER("4", "Carpenter"),
    ELECTRICIAN("5", "Electrician"),
    TEACHER("6", "Teacher"),
    TAILOR("7", "Tailor"),
    HOMEMAKER("8", "Homemaker"),
    BUSINESS("9", "Business"),
    DAILY_WAGE_WORKER("10", "Daily Wage Worker"),
    PRIVATE_EMPLOYEE("11", "Private Employee"),
    OTHER("12", "Other");

    private final String value;
    private final String label;

    ParentOccupation(String value, String label) {
        this.value = value;
        this.label = label;
    }

    public String getValue() {
        return value;
    }

    public String getLabel() {
        return label;
    }
}
