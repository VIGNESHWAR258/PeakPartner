package com.peakpartner.plan.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateMealLogRequest {
    @NotNull private UUID connectionId;
    private UUID dietMealId;
    @NotNull private LocalDate logDate;
    @NotNull private String mealName;
    @NotNull private String compliance; // ON_PLAN, PARTIAL, OFF_PLAN, SKIPPED
    private String photoUrl;
    private String itemsConsumed;
    private Integer estimatedCalories;
    private BigDecimal proteinGrams;
    private BigDecimal carbsGrams;
    private BigDecimal fatGrams;
    private String notes;
}
