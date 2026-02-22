package com.peakpartner.plan.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "diet_meal_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DietMealItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diet_meal_id", nullable = false)
    private DietPlanMeal dietMeal;

    @Column(name = "food_name", nullable = false, length = 200)
    private String foodName;

    @Column(length = 50)
    private String quantity;

    private Integer calories;

    @Column(name = "protein_grams", precision = 5, scale = 1)
    private BigDecimal proteinGrams;

    @Column(name = "carbs_grams", precision = 5, scale = 1)
    private BigDecimal carbsGrams;

    @Column(name = "fat_grams", precision = 5, scale = 1)
    private BigDecimal fatGrams;

    @Column(columnDefinition = "TEXT")
    private String alternatives;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;
}
