package com.peakpartner.plan.dto;

import com.peakpartner.plan.model.WorkoutPlan;
import com.peakpartner.plan.model.PlanDay;
import com.peakpartner.plan.model.PlanExercise;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
public class WorkoutPlanResponse {
    private UUID id;
    private UUID connectionId;
    private UUID trainerId;
    private UUID clientId;
    private String trainerName;
    private String clientName;
    private String title;
    private String description;
    private String program;
    private String duration;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDateTime createdAt;
    private List<PlanDayResponse> days;

    @Data
    public static class PlanDayResponse {
        private UUID id;
        private Integer dayNumber;
        private String dayName;
        private String focusArea;
        private String notes;
        private List<ExerciseResponse> exercises;

        public static PlanDayResponse fromEntity(PlanDay day) {
            PlanDayResponse r = new PlanDayResponse();
            r.setId(day.getId());
            r.setDayNumber(day.getDayNumber());
            r.setDayName(day.getDayName());
            r.setFocusArea(day.getFocusArea());
            r.setNotes(day.getNotes());
            if (day.getExercises() != null) {
                r.setExercises(day.getExercises().stream()
                        .map(ExerciseResponse::fromEntity)
                        .collect(Collectors.toList()));
            }
            return r;
        }
    }

    @Data
    public static class ExerciseResponse {
        private UUID id;
        private String exerciseName;
        private Integer sets;
        private String reps;
        private String weightSuggestion;
        private Integer restSeconds;
        private String notes;
        private Integer sortOrder;

        public static ExerciseResponse fromEntity(PlanExercise e) {
            ExerciseResponse r = new ExerciseResponse();
            r.setId(e.getId());
            r.setExerciseName(e.getExerciseName());
            r.setSets(e.getSets());
            r.setReps(e.getReps());
            r.setWeightSuggestion(e.getWeightSuggestion());
            r.setRestSeconds(e.getRestSeconds());
            r.setNotes(e.getNotes());
            r.setSortOrder(e.getSortOrder());
            return r;
        }
    }

    public static WorkoutPlanResponse fromEntity(WorkoutPlan plan) {
        WorkoutPlanResponse r = new WorkoutPlanResponse();
        r.setId(plan.getId());
        r.setConnectionId(plan.getConnection().getId());
        r.setTrainerId(plan.getTrainer().getId());
        r.setClientId(plan.getClient().getId());
        r.setTrainerName(plan.getTrainer().getFullName());
        r.setClientName(plan.getClient().getFullName());
        r.setTitle(plan.getTitle());
        r.setDescription(plan.getDescription());
        r.setProgram(plan.getProgram() != null ? plan.getProgram().name() : null);
        r.setDuration(plan.getDuration() != null ? plan.getDuration().name() : null);
        r.setStatus(plan.getStatus() != null ? plan.getStatus().name() : null);
        r.setStartDate(plan.getStartDate());
        r.setEndDate(plan.getEndDate());
        r.setCreatedAt(plan.getCreatedAt());
        if (plan.getDays() != null) {
            r.setDays(plan.getDays().stream()
                    .map(PlanDayResponse::fromEntity)
                    .collect(Collectors.toList()));
        }
        return r;
    }
}
