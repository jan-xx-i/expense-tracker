package com.expensetracker.service;

import com.expensetracker.dto.DashboardDtos.DashboardResponse;
import com.expensetracker.dto.DashboardDtos.MonthlyPoint;
import com.expensetracker.dto.ExpenseDtos.ExpenseResponse;
import com.expensetracker.entity.Expense;
import com.expensetracker.entity.Income;
import com.expensetracker.entity.User;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.IncomeRepository;
import com.expensetracker.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ExpenseRepository expenseRepository;
    private final IncomeRepository incomeRepository;
    private final CurrentUser currentUser;

    private static final DateTimeFormatter MONTH_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM");

    public DashboardResponse getDashboard() {
        User user = currentUser.get();

        List<Expense> allExpenses = expenseRepository.findByUserId(user.getId());
        List<Income> allIncome = incomeRepository.findByUserId(user.getId());

        BigDecimal totalExpense = sumExpenses(allExpenses);
        BigDecimal totalIncome = sumIncome(allIncome);
        BigDecimal totalBalance = totalIncome.subtract(totalExpense);

        YearMonth currentMonth = YearMonth.now();
        BigDecimal currentMonthExpense = sumExpenses(filterByMonth(allExpenses, currentMonth));
        BigDecimal currentMonthIncome = sumIncome(filterIncomeByMonth(allIncome, currentMonth));

        Map<String, BigDecimal> categoryBreakdown = allExpenses.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getCategory().name(),
                        LinkedHashMap::new,
                        Collectors.reducing(BigDecimal.ZERO, Expense::getAmount, BigDecimal::add)
                ));

        List<MonthlyPoint> monthlyTrend = buildMonthlyTrend(allExpenses, allIncome, 6);

        List<ExpenseResponse> recentExpenses = allExpenses.stream()
                .sorted((a, b) -> b.getDate().compareTo(a.getDate()))
                .limit(5)
                .map(e -> ExpenseResponse.builder()
                        .id(e.getId())
                        .title(e.getTitle())
                        .amount(e.getAmount())
                        .category(e.getCategory())
                        .description(e.getDescription())
                        .date(e.getDate())
                        .paymentMethod(e.getPaymentMethod())
                        .build())
                .toList();

        return DashboardResponse.builder()
                .totalBalance(totalBalance)
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .currentMonthIncome(currentMonthIncome)
                .currentMonthExpense(currentMonthExpense)
                .categoryBreakdown(categoryBreakdown)
                .monthlyTrend(monthlyTrend)
                .recentExpenses(recentExpenses)
                .build();
    }

    private BigDecimal sumExpenses(List<Expense> expenses) {
        return expenses.stream().map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumIncome(List<Income> incomes) {
        return incomes.stream().map(Income::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private List<Expense> filterByMonth(List<Expense> expenses, YearMonth month) {
        return expenses.stream()
                .filter(e -> YearMonth.from(e.getDate()).equals(month))
                .toList();
    }

    private List<Income> filterIncomeByMonth(List<Income> incomes, YearMonth month) {
        return incomes.stream()
                .filter(i -> YearMonth.from(i.getDate()).equals(month))
                .toList();
    }

    // Builds a trend line for the last N months (oldest first) so the
    // frontend chart can plot income vs expense over time.
    private List<MonthlyPoint> buildMonthlyTrend(List<Expense> expenses, List<Income> incomes, int months) {
        List<MonthlyPoint> points = new ArrayList<>();
        YearMonth cursor = YearMonth.now().minusMonths(months - 1L);

        for (int i = 0; i < months; i++) {
            YearMonth month = cursor.plusMonths(i);
            BigDecimal monthExpense = sumExpenses(filterByMonth(expenses, month));
            BigDecimal monthIncome = sumIncome(filterIncomeByMonth(incomes, month));

            points.add(MonthlyPoint.builder()
                    .month(month.format(MONTH_FORMAT))
                    .income(monthIncome)
                    .expense(monthExpense)
                    .build());
        }
        return points;
    }
}
