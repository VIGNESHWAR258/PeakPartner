package com.peakpartner.plan.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class CreateDietPlanRequest {
    @NotNull private UUID connectionId;
    @NotNull private String title;
    private String description;
    @NotNull private LocalDate startDate;
    @NotNull private LocalDate endDate;
    private Integer dailyCalorieTarget;
    private Integer proteinGrams;
    private Integer carbsGrams;
    private Integer fatGrams;
    private String notes;
    private List<MealInput> meals;

    @Data
    public static class MealInput {
        private String mealName;
        private String mealTime;
        private List<MealItemInput> items;
    }

    @Data
    public static class MealItemInput {
        private String foodName;
        private String quantity;
        private Integer calories;
        private BigDecimal proteinGrams;
        private BigDecimal carbsGrams;
        private BigDecimal fatGrams;
        private String alternatives;
        private String instructions;
    }
}
