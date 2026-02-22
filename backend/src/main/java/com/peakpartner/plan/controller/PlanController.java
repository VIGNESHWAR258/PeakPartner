package com.peakpartner.plan.controller;

import com.peakpartner.common.dto.ApiResponse;
import com.peakpartner.plan.dto.*;
import com.peakpartner.plan.service.PlanService;
import com.peakpartner.profile.model.Profile;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/plans")
@RequiredArgsConstructor
public class PlanController {

    private final PlanService planService;

    // ==================== WORKOUT PLANS ====================

    @PostMapping("/workout")
    public ResponseEntity<ApiResponse<WorkoutPlanResponse>> createWorkoutPlan(
            @AuthenticationPrincipal Profile currentUser,
            @RequestBody CreateWorkoutPlanRequest request) {
        WorkoutPlanResponse plan = planService.createWorkoutPlan(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Workout plan created", plan));
    }

    @GetMapping("/workout")
    public ResponseEntity<ApiResponse<List<WorkoutPlanResponse>>> getWorkoutPlans(
            @AuthenticationPrincipal Profile currentUser,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) UUID connectionId) {
        List<WorkoutPlanResponse> plans;
        if (connectionId != null) {
            plans = planService.getWorkoutPlansByConnection(connectionId);
        } else if ("client".equalsIgnoreCase(role)) {
            plans = planService.getWorkoutPlansByClient(currentUser.getId());
        } else {
            plans = planService.getWorkoutPlansByTrainer(currentUser.getId());
        }
        return ResponseEntity.ok(ApiResponse.success("Workout plans retrieved", plans));
    }

    @GetMapping("/workout/{id}")
    public ResponseEntity<ApiResponse<WorkoutPlanResponse>> getWorkoutPlan(@PathVariable UUID id) {
        WorkoutPlanResponse plan = planService.getWorkoutPlan(id);
        return ResponseEntity.ok(ApiResponse.success("Workout plan retrieved", plan));
    }

    @PutMapping("/workout/{id}/activate")
    public ResponseEntity<ApiResponse<WorkoutPlanResponse>> activateWorkoutPlan(
            @AuthenticationPrincipal Profile currentUser,
            @PathVariable UUID id) {
        WorkoutPlanResponse plan = planService.activateWorkoutPlan(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Workout plan activated", plan));
    }

    @PutMapping("/workout/{id}/cancel")
    public ResponseEntity<ApiResponse<WorkoutPlanResponse>> cancelWorkoutPlan(
            @AuthenticationPrincipal Profile currentUser,
            @PathVariable UUID id) {
        WorkoutPlanResponse plan = planService.cancelWorkoutPlan(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Workout plan cancelled", plan));
    }

    // ==================== DIET PLANS ====================

    @PostMapping("/diet")
    public ResponseEntity<ApiResponse<DietPlanResponse>> createDietPlan(
            @AuthenticationPrincipal Profile currentUser,
            @RequestBody CreateDietPlanRequest request) {
        DietPlanResponse plan = planService.createDietPlan(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Diet plan created", plan));
    }

    @GetMapping("/diet")
    public ResponseEntity<ApiResponse<List<DietPlanResponse>>> getDietPlans(
            @AuthenticationPrincipal Profile currentUser,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) UUID connectionId) {
        List<DietPlanResponse> plans;
        if (connectionId != null) {
            plans = planService.getDietPlansByConnection(connectionId);
        } else if ("client".equalsIgnoreCase(role)) {
            plans = planService.getDietPlansByClient(currentUser.getId());
        } else {
            plans = planService.getDietPlansByTrainer(currentUser.getId());
        }
        return ResponseEntity.ok(ApiResponse.success("Diet plans retrieved", plans));
    }

    @GetMapping("/diet/{id}")
    public ResponseEntity<ApiResponse<DietPlanResponse>> getDietPlan(@PathVariable UUID id) {
        DietPlanResponse plan = planService.getDietPlan(id);
        return ResponseEntity.ok(ApiResponse.success("Diet plan retrieved", plan));
    }

    @PutMapping("/diet/{id}/activate")
    public ResponseEntity<ApiResponse<DietPlanResponse>> activateDietPlan(
            @AuthenticationPrincipal Profile currentUser,
            @PathVariable UUID id) {
        DietPlanResponse plan = planService.activateDietPlan(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Diet plan activated", plan));
    }

    @PutMapping("/diet/{id}/cancel")
    public ResponseEntity<ApiResponse<DietPlanResponse>> cancelDietPlan(
            @AuthenticationPrincipal Profile currentUser,
            @PathVariable UUID id) {
        DietPlanResponse plan = planService.cancelDietPlan(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Diet plan cancelled", plan));
    }

    // ==================== EXERCISE LOGS ====================

    @PostMapping("/exercise-logs")
    public ResponseEntity<ApiResponse<ExerciseLogResponse>> createExerciseLog(
            @AuthenticationPrincipal Profile currentUser,
            @RequestBody CreateExerciseLogRequest request) {
        ExerciseLogResponse log = planService.createExerciseLog(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Exercise logged", log));
    }

    @GetMapping("/exercise-logs")
    public ResponseEntity<ApiResponse<List<ExerciseLogResponse>>> getExerciseLogs(
            @RequestParam UUID connectionId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<ExerciseLogResponse> logs;
        if (date != null) {
            logs = planService.getExerciseLogsByConnectionAndDate(connectionId, date);
        } else {
            logs = planService.getExerciseLogsByConnection(connectionId);
        }
        return ResponseEntity.ok(ApiResponse.success("Exercise logs retrieved", logs));
    }

    // ==================== MEAL LOGS ====================

    @PostMapping("/meal-logs")
    public ResponseEntity<ApiResponse<MealLogResponse>> createMealLog(
            @AuthenticationPrincipal Profile currentUser,
            @RequestBody CreateMealLogRequest request) {
        MealLogResponse log = planService.createMealLog(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Meal logged", log));
    }

    @GetMapping("/meal-logs")
    public ResponseEntity<ApiResponse<List<MealLogResponse>>> getMealLogs(
            @RequestParam(required = false) UUID connectionId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) UUID clientId) {
        List<MealLogResponse> logs;
        if (connectionId != null && date != null) {
            logs = planService.getMealLogsByConnectionAndDate(connectionId, date);
        } else if (connectionId != null) {
            logs = planService.getMealLogsByConnection(connectionId);
        } else if (clientId != null) {
            logs = planService.getMealLogsByClient(clientId);
        } else {
            logs = List.of();
        }
        return ResponseEntity.ok(ApiResponse.success("Meal logs retrieved", logs));
    }

    @PutMapping("/meal-logs/{id}/verify")
    public ResponseEntity<ApiResponse<MealLogResponse>> verifyMealLog(
            @AuthenticationPrincipal Profile currentUser,
            @PathVariable UUID id) {
        MealLogResponse log = planService.verifyMealLog(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Meal log verified", log));
    }
}
