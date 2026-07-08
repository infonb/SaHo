package com.saho.foundation.dto.imports;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BulkImportResponse {
    private boolean success;
    private int totalRows;
    private int validRows;
    private int invalidRows;
    private Integer studentsImported;
    private Integer guardiansCreated;
    private List<ImportErrorDto> errors;
}
