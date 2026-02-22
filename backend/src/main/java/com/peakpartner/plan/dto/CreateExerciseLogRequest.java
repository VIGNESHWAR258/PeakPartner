package com.peakpartner.plan.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateExerciseLogRequest {
    @NotNull private UUID connectionId;
    private UUID planExerciseId;
    @NotNull private String exerciseName;
    @NotNull private LocalDate logDate;
    private Integer setsCompleted;
    private Integer repsCompleted;
    private BigDecimal weightUsed;
    private String weightUnit;
    private Integer durationSeconds;
    private Boolean isPr;
    private String notes;
}
