package com.saho.foundation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentPaginationResponseDto {

    private Integer pageNumber;
    private Integer pageSize;
    private Integer totalCount;
    private Integer boysCount;
    private Integer girlsCount;
    private Integer sponsoredCount;
    private Integer orphansCount;
    private List<StudentListResponseDto> students;
}
