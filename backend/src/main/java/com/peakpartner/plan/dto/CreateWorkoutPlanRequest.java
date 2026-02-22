package com.peakpartner.plan.dto;

import com.peakpartner.connection.model.Connection;
import com.peakpartner.plan.model.WorkoutPlan;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class CreateWorkoutPlanRequest {
    @NotNull private UUID connectionId;
    @NotNull private String title;
    private String description;
    @NotNull private Connection.ProgramType program;
    @NotNull private String duration; // WEEKLY, MONTHLY, CUSTOM
    @NotNull private LocalDate startDate;
    @NotNull private LocalDate endDate;
    private List<PlanDayInput> days;

    @Data
    public static class PlanDayInput {
        private Integer dayNumber;
        private String dayName;
        private String focusArea;
        private String notes;
        private List<ExerciseInput> exercises;
    }

    @Data
    public static class ExerciseInput {
        private String exerciseName;
        private Integer sets;
        private String reps;
        private String weightSuggestion;
        private Integer restSeconds;
        private String notes;
    }
}
