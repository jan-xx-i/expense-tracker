package com.expensetracker.service;

import com.expensetracker.dto.IncomeDtos.IncomeRequest;
import com.expensetracker.dto.IncomeDtos.IncomeResponse;
import com.expensetracker.entity.Income;
import com.expensetracker.entity.User;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.IncomeRepository;
import com.expensetracker.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class IncomeService {

    private final IncomeRepository incomeRepository;
    private final CurrentUser currentUser;

    public List<IncomeResponse> getAll(LocalDate from, LocalDate to) {
        User user = currentUser.get();
        List<Income> incomes = (from != null && to != null)
                ? incomeRepository.findByUserIdAndDateBetween(user.getId(), from, to)
                : incomeRepository.findByUserIdOrderByDateDesc(user.getId());

        return incomes.stream().map(this::toResponse).toList();
    }

    public IncomeResponse create(IncomeRequest request) {
        User user = currentUser.get();
        Income income = Income.builder()
                .source(request.getSource())
                .amount(request.getAmount())
                .description(request.getDescription())
                .date(request.getDate())
                .user(user)
                .build();

        return toResponse(incomeRepository.save(income));
    }

    public IncomeResponse update(Long id, IncomeRequest request) {
        Income income = findOwnedIncome(id);
        income.setSource(request.getSource());
        income.setAmount(request.getAmount());
        income.setDescription(request.getDescription());
        income.setDate(request.getDate());

        return toResponse(incomeRepository.save(income));
    }

    public void delete(Long id) {
        incomeRepository.delete(findOwnedIncome(id));
    }

    private Income findOwnedIncome(Long id) {
        User user = currentUser.get();
        Income income = incomeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Income not found with id: " + id));

        if (!income.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Income not found with id: " + id);
        }
        return income;
    }

    private IncomeResponse toResponse(Income i) {
        return IncomeResponse.builder()
                .id(i.getId())
                .source(i.getSource())
                .amount(i.getAmount())
                .description(i.getDescription())
                .date(i.getDate())
                .build();
    }
}
