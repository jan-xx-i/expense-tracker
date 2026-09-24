package com.expensetracker.service;

import com.expensetracker.dto.ExpenseDtos.ExpenseRequest;
import com.expensetracker.dto.ExpenseDtos.ExpenseResponse;
import com.expensetracker.entity.Category;
import com.expensetracker.entity.Expense;
import com.expensetracker.entity.User;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final CurrentUser currentUser;

    public List<ExpenseResponse> getAll(Category category, LocalDate from, LocalDate to, String sortBy, String direction) {
        User user = currentUser.get();
        List<Expense> expenses;

        if (from != null && to != null) {
            expenses = expenseRepository.findByUserIdAndDateBetween(user.getId(), from, to);
        } else if (category != null) {
            expenses = expenseRepository.findByUserIdAndCategory(user.getId(), category);
        } else {
            expenses = expenseRepository.findByUserId(user.getId());
        }

        // Category filter can still be applied on top of a date range.
        if (category != null && from != null && to != null) {
            expenses = expenses.stream().filter(e -> e.getCategory() == category).toList();
        }

        Comparator<Expense> comparator = "amount".equalsIgnoreCase(sortBy)
                ? Comparator.comparing(Expense::getAmount)
                : Comparator.comparing(Expense::getDate);

        if ("desc".equalsIgnoreCase(direction)) {
            comparator = comparator.reversed();
        }

        return expenses.stream()
                .sorted(comparator)
                .map(this::toResponse)
                .toList();
    }

    public ExpenseResponse getById(Long id) {
        Expense expense = findOwnedExpense(id);
        return toResponse(expense);
    }

    public ExpenseResponse create(ExpenseRequest request) {
        User user = currentUser.get();
        Expense expense = Expense.builder()
                .title(request.getTitle())
                .amount(request.getAmount())
                .category(request.getCategory())
                .description(request.getDescription())
                .date(request.getDate())
                .paymentMethod(request.getPaymentMethod())
                .user(user)
                .build();

        return toResponse(expenseRepository.save(expense));
    }

    public ExpenseResponse update(Long id, ExpenseRequest request) {
        Expense expense = findOwnedExpense(id);

        expense.setTitle(request.getTitle());
        expense.setAmount(request.getAmount());
        expense.setCategory(request.getCategory());
        expense.setDescription(request.getDescription());
        expense.setDate(request.getDate());
        expense.setPaymentMethod(request.getPaymentMethod());

        return toResponse(expenseRepository.save(expense));
    }

    public void delete(Long id) {
        Expense expense = findOwnedExpense(id);
        expenseRepository.delete(expense);
    }

    // Loads an expense AND verifies it belongs to the logged-in user.
    // This single check is what stops User A from editing/deleting User B's data.
    private Expense findOwnedExpense(Long id) {
        User user = currentUser.get();
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));

        if (!expense.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Expense not found with id: " + id);
        }
        return expense;
    }

    private ExpenseResponse toResponse(Expense e) {
        return ExpenseResponse.builder()
                .id(e.getId())
                .title(e.getTitle())
                .amount(e.getAmount())
                .category(e.getCategory())
                .description(e.getDescription())
                .date(e.getDate())
                .paymentMethod(e.getPaymentMethod())
                .build();
    }
}
