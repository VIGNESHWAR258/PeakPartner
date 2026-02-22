package com.peakpartner.plan.dto;

import com.peakpartner.plan.model.ExerciseLog;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class ExerciseLogResponse {
    private UUID id;
    private UUID connectionId;
    private UUID loggedById;
    private String loggedByName;
    private UUID planExerciseId;
    private String exerciseName;
    private LocalDate logDate;
    private Integer setsCompleted;
    private Integer repsCompleted;
    private BigDecimal weightUsed;
    private String weightUnit;
    private Integer durationSeconds;
    private Boolean isPr;
    private String notes;
    private LocalDateTime createdAt;

    public static ExerciseLogResponse fromEntity(ExerciseLog log) {
        ExerciseLogResponse r = new ExerciseLogResponse();
        r.setId(log.getId());
        r.setConnectionId(log.getConnection().getId());
        r.setLoggedById(log.getLoggedBy().getId());
        r.setLoggedByName(log.getLoggedBy().getFullName());
        r.setPlanExerciseId(log.getPlanExercise() != null ? log.getPlanExercise().getId() : null);
        r.setExerciseName(log.getExerciseName());
        r.setLogDate(log.getLogDate());
        r.setSetsCompleted(log.getSetsCompleted());
        r.setRepsCompleted(log.getRepsCompleted());
        r.setWeightUsed(log.getWeightUsed());
        r.setWeightUnit(log.getWeightUnit());
        r.setDurationSeconds(log.getDurationSeconds());
        r.setIsPr(log.getIsPr());
        r.setNotes(log.getNotes());
        r.setCreatedAt(log.getCreatedAt());
        return r;
    }
}
