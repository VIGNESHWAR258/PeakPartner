package com.peakpartner.plan.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "diet_plan_meals")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DietPlanMeal {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diet_plan_id", nullable = false)
    private DietPlan dietPlan;

    @Column(name = "meal_name", nullable = false, length = 100)
    private String mealName;

    @Column(name = "meal_time")
    private LocalTime mealTime;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Builder.Default
    @OneToMany(mappedBy = "dietMeal", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<DietMealItem> items = new ArrayList<>();
}
