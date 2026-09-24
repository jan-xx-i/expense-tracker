package com.expensetracker.repository;

import com.expensetracker.entity.Category;
import com.expensetracker.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    // Every query is scoped by userId - this is how we make sure
    // one user can never see or modify another user's data.
    List<Expense> findByUserId(Long userId);

    List<Expense> findByUserIdAndCategory(Long userId, Category category);

    List<Expense> findByUserIdAndDateBetween(Long userId, LocalDate start, LocalDate end);

    List<Expense> findByUserIdOrderByDateDesc(Long userId);
}
