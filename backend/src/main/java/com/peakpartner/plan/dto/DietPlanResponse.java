package com.peakpartner.plan.dto;

import com.peakpartner.plan.model.DietPlan;
import com.peakpartner.plan.model.DietPlanMeal;
import com.peakpartner.plan.model.DietMealItem;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
public class DietPlanResponse {
    private UUID id;
    private UUID connectionId;
    private UUID trainerId;
    private UUID clientId;
    private String trainerName;
    private String clientName;
    private String title;
    private String description;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer dailyCalorieTarget;
    private Integer proteinGrams;
    private Integer carbsGrams;
    private Integer fatGrams;
    private String notes;
    private LocalDateTime createdAt;
    private List<MealResponse> meals;

    @Data
    public static class MealResponse {
        private UUID id;
        private String mealName;
        private String mealTime;
        private Integer sortOrder;
        private List<MealItemResponse> items;

        public static MealResponse fromEntity(DietPlanMeal meal) {
            MealResponse r = new MealResponse();
            r.setId(meal.getId());
            r.setMealName(meal.getMealName());
            r.setMealTime(meal.getMealTime() != null ? meal.getMealTime().toString() : null);
            r.setSortOrder(meal.getSortOrder());
            if (meal.getItems() != null) {
                r.setItems(meal.getItems().stream()
                        .map(MealItemResponse::fromEntity)
                        .collect(Collectors.toList()));
            }
            return r;
        }
    }

    @Data
    public static class MealItemResponse {
        private UUID id;
        private String foodName;
        private String quantity;
        private Integer calories;
        private BigDecimal proteinGrams;
        private BigDecimal carbsGrams;
        private BigDecimal fatGrams;
        private String alternatives;

        public static MealItemResponse fromEntity(DietMealItem item) {
            MealItemResponse r = new MealItemResponse();
            r.setId(item.getId());
            r.setFoodName(item.getFoodName());
            r.setQuantity(item.getQuantity());
            r.setCalories(item.getCalories());
            r.setProteinGrams(item.getProteinGrams());
            r.setCarbsGrams(item.getCarbsGrams());
            r.setFatGrams(item.getFatGrams());
            r.setAlternatives(item.getAlternatives());
            return r;
        }
    }

    public static DietPlanResponse fromEntity(DietPlan plan) {
        DietPlanResponse r = new DietPlanResponse();
        r.setId(plan.getId());
        r.setConnectionId(plan.getConnection().getId());
        r.setTrainerId(plan.getTrainer().getId());
        r.setClientId(plan.getClient().getId());
        r.setTrainerName(plan.getTrainer().getFullName());
        r.setClientName(plan.getClient().getFullName());
        r.setTitle(plan.getTitle());
        r.setDescription(plan.getDescription());
        r.setStatus(plan.getStatus() != null ? plan.getStatus().name() : null);
        r.setStartDate(plan.getStartDate());
        r.setEndDate(plan.getEndDate());
        r.setDailyCalorieTarget(plan.getDailyCalorieTarget());
        r.setProteinGrams(plan.getProteinGrams());
        r.setCarbsGrams(plan.getCarbsGrams());
        r.setFatGrams(plan.getFatGrams());
        r.setNotes(plan.getNotes());
        r.setCreatedAt(plan.getCreatedAt());
        if (plan.getMeals() != null) {
            r.setMeals(plan.getMeals().stream()
                    .map(MealResponse::fromEntity)
                    .collect(Collectors.toList()));
        }
        return r;
    }
}
