package com.peakpartner.plan.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "plan_exercises")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanExercise {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_day_id", nullable = false)
    private PlanDay planDay;

    @Column(name = "exercise_name", nullable = false, length = 200)
    private String exerciseName;

    private Integer sets;

    @Column(length = 50)
    private String reps;

    @Column(name = "weight_suggestion", length = 50)
    private String weightSuggestion;

    @Column(name = "rest_seconds")
    private Integer restSeconds;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;
}
