package com.expensetracker.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

public class IncomeDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IncomeRequest {
        @NotBlank(message = "Source is required")
        private String source;

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        private BigDecimal amount;

        private String description;

        @NotNull(message = "Date is required")
        private LocalDate date;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IncomeResponse {
        private Long id;
        private String source;
        private BigDecimal amount;
        private String description;
        private LocalDate date;
    }
}
