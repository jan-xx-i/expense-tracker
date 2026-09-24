package com.expensetracker.dto;

import com.expensetracker.entity.Category;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ExpenseDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExpenseRequest {
        @NotBlank(message = "Title is required")
        private String title;

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        private BigDecimal amount;

        @NotNull(message = "Category is required")
        private Category category;

        private String description;

        @NotNull(message = "Date is required")
        private LocalDate date;

        private String paymentMethod;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ExpenseResponse {
        private Long id;
        private String title;
        private BigDecimal amount;
        private Category category;
        private String description;
        private LocalDate date;
        private String paymentMethod;
    }
}
