package com.peakpartner.plan.model;

import com.peakpartner.connection.model.Connection;
import com.peakpartner.profile.model.Profile;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "meal_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MealLog {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "connection_id", nullable = false)
    private Connection connection;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Profile client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diet_meal_id")
    private DietPlanMeal dietMeal;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Column(name = "meal_name", nullable = false, length = 100)
    private String mealName;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(columnDefinition = "meal_compliance")
    private MealCompliance compliance = MealCompliance.ON_PLAN;

    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl;

    @Column(name = "items_consumed", columnDefinition = "TEXT")
    private String itemsConsumed;

    @Column(name = "estimated_calories")
    private Integer estimatedCalories;

    @Column(name = "protein_grams", precision = 5, scale = 1)
    private BigDecimal proteinGrams;

    @Column(name = "carbs_grams", precision = 5, scale = 1)
    private BigDecimal carbsGrams;

    @Column(name = "fat_grams", precision = 5, scale = 1)
    private BigDecimal fatGrams;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "trainer_verified")
    private Boolean trainerVerified = false;

    @Column(name = "trainer_verified_at")
    private LocalDateTime trainerVerifiedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum MealCompliance { ON_PLAN, PARTIAL, OFF_PLAN, SKIPPED }
}
