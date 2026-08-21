package com.saho.foundation.exception;

import com.saho.foundation.dto.imports.ImportErrorDto;
import lombok.Getter;

import java.util.List;

@Getter
public class ImportValidationException extends RuntimeException {
    private final List<ImportErrorDto> errors;

    public ImportValidationException(List<ImportErrorDto> errors) {
        super("Import validation failed");
        this.errors = errors;
    }
}
