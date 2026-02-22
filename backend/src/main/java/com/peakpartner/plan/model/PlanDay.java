package com.peakpartner.plan.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "plan_days")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanDay {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private WorkoutPlan plan;

    @Column(name = "day_number", nullable = false)
    private Integer dayNumber;

    @Column(name = "day_name", length = 20)
    private String dayName;

    @Column(name = "focus_area", length = 100)
    private String focusArea;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Builder.Default
    @OneToMany(mappedBy = "planDay", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<PlanExercise> exercises = new ArrayList<>();
}
