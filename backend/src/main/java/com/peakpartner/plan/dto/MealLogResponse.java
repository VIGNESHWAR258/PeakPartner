package com.peakpartner.plan.dto;

import com.peakpartner.plan.model.MealLog;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class MealLogResponse {
    private UUID id;
    private UUID connectionId;
    private UUID clientId;
    private String clientName;
    private UUID dietMealId;
    private LocalDate logDate;
    private String mealName;
    private String compliance;
    private String photoUrl;
    private String itemsConsumed;
    private Integer estimatedCalories;
    private BigDecimal proteinGrams;
    private BigDecimal carbsGrams;
    private BigDecimal fatGrams;
    private String notes;
    private Boolean trainerVerified;
    private LocalDateTime trainerVerifiedAt;
    private LocalDateTime createdAt;

    public static MealLogResponse fromEntity(MealLog log) {
        MealLogResponse r = new MealLogResponse();
        r.setId(log.getId());
        r.setConnectionId(log.getConnection().getId());
        r.setClientId(log.getClient().getId());
        r.setClientName(log.getClient().getFullName());
        r.setDietMealId(log.getDietMeal() != null ? log.getDietMeal().getId() : null);
        r.setLogDate(log.getLogDate());
        r.setMealName(log.getMealName());
        r.setCompliance(log.getCompliance() != null ? log.getCompliance().name() : null);
        r.setPhotoUrl(log.getPhotoUrl());
        r.setItemsConsumed(log.getItemsConsumed());
        r.setEstimatedCalories(log.getEstimatedCalories());
        r.setProteinGrams(log.getProteinGrams());
        r.setCarbsGrams(log.getCarbsGrams());
        r.setFatGrams(log.getFatGrams());
        r.setNotes(log.getNotes());
        r.setTrainerVerified(log.getTrainerVerified());
        r.setTrainerVerifiedAt(log.getTrainerVerifiedAt());
        r.setCreatedAt(log.getCreatedAt());
        return r;
    }
}
