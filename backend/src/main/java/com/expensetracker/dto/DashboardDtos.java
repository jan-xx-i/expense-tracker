package com.expensetracker.dto;

import com.expensetracker.dto.ExpenseDtos.ExpenseResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class DashboardDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MonthlyPoint {
        private String month;      // e.g. "2026-09"
        private BigDecimal income;
        private BigDecimal expense;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DashboardResponse {
        private BigDecimal totalBalance;
        private BigDecimal totalIncome;
        private BigDecimal totalExpense;
        private BigDecimal currentMonthIncome;
        private BigDecimal currentMonthExpense;
        private Map<String, BigDecimal> categoryBreakdown; // category -> total spent
        private List<MonthlyPoint> monthlyTrend;            // last 6 months
        private List<ExpenseResponse> recentExpenses;       // last 5
    }
}
