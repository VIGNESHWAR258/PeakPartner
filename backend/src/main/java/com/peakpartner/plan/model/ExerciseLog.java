package com.peakpartner.plan.model;

import com.peakpartner.connection.model.Connection;
import com.peakpartner.profile.model.Profile;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "exercise_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseLog {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "connection_id", nullable = false)
    private Connection connection;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_exercise_id")
    private PlanExercise planExercise;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "logged_by", nullable = false)
    private Profile loggedBy;

    @Column(name = "exercise_name", nullable = false, length = 200)
    private String exerciseName;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Column(name = "sets_completed")
    private Integer setsCompleted;

    @Column(name = "reps_completed")
    private Integer repsCompleted;

    @Column(name = "weight_used", precision = 10, scale = 2)
    private BigDecimal weightUsed;

    @Column(name = "weight_unit", length = 5)
    private String weightUnit = "kg";

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "is_pr")
    private Boolean isPr = false;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
