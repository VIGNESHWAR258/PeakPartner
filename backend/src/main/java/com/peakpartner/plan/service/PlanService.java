package com.peakpartner.plan.service;

import com.peakpartner.connection.model.Connection;
import com.peakpartner.connection.repository.ConnectionRepository;
import com.peakpartner.plan.dto.*;
import com.peakpartner.plan.model.*;
import com.peakpartner.plan.repository.*;
import com.peakpartner.profile.model.Profile;
import com.peakpartner.profile.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlanService {

    private final WorkoutPlanRepository workoutPlanRepository;
    private final DietPlanRepository dietPlanRepository;
    private final ExerciseLogRepository exerciseLogRepository;
    private final MealLogRepository mealLogRepository;
    private final ConnectionRepository connectionRepository;
    private final ProfileRepository profileRepository;

    // ==================== WORKOUT PLANS ====================

    @Transactional
    public WorkoutPlanResponse createWorkoutPlan(UUID trainerId, CreateWorkoutPlanRequest req) {
        Connection connection = connectionRepository.findById(req.getConnectionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Connection not found"));

        if (!connection.getTrainer().getId().equals(trainerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the trainer can create plans");
        }
        if (connection.getStatus() != Connection.ConnectionStatus.ACCEPTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Connection must be accepted");
        }

        Profile trainer = connection.getTrainer();
        Profile client = connection.getClient();

        WorkoutPlan plan = WorkoutPlan.builder()
                .connection(connection)
                .trainer(trainer)
                .client(client)
                .title(req.getTitle())
                .description(req.getDescription())
                .program(req.getProgram())
                .duration(WorkoutPlan.PlanDuration.valueOf(req.getDuration()))
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .status(WorkoutPlan.PlanStatus.DRAFT)
                .build();

        if (req.getDays() != null) {
            for (CreateWorkoutPlanRequest.PlanDayInput dayInput : req.getDays()) {
                PlanDay day = PlanDay.builder()
                        .plan(plan)
                        .dayNumber(dayInput.getDayNumber())
                        .dayName(dayInput.getDayName())
                        .focusArea(dayInput.getFocusArea())
                        .notes(dayInput.getNotes())
                        .build();

                if (dayInput.getExercises() != null) {
                    AtomicInteger order = new AtomicInteger(0);
                    List<PlanExercise> exercises = dayInput.getExercises().stream().map(exInput -> {
                        return PlanExercise.builder()
                                .planDay(day)
                                .exerciseName(exInput.getExerciseName())
                                .sets(exInput.getSets())
                                .reps(exInput.getReps())
                                .weightSuggestion(exInput.getWeightSuggestion())
                                .restSeconds(exInput.getRestSeconds())
                                .notes(exInput.getNotes())
                                .sortOrder(order.getAndIncrement())
                                .build();
                    }).collect(Collectors.toList());
                    day.setExercises(exercises);
                }
                plan.getDays().add(day);
            }
        }

        WorkoutPlan saved = workoutPlanRepository.save(plan);
        return WorkoutPlanResponse.fromEntity(saved);
    }

    public List<WorkoutPlanResponse> getWorkoutPlansByTrainer(UUID trainerId) {
        return workoutPlanRepository.findByTrainerIdOrderByCreatedAtDesc(trainerId).stream()
                .map(WorkoutPlanResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<WorkoutPlanResponse> getWorkoutPlansByClient(UUID clientId) {
        return workoutPlanRepository.findByClientIdOrderByCreatedAtDesc(clientId).stream()
                .filter(p -> p.getStatus() != WorkoutPlan.PlanStatus.DRAFT)
                .map(WorkoutPlanResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<WorkoutPlanResponse> getWorkoutPlansByConnection(UUID connectionId) {
        return workoutPlanRepository.findByConnectionIdOrderByCreatedAtDesc(connectionId).stream()
                .map(WorkoutPlanResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public WorkoutPlanResponse getWorkoutPlan(UUID planId) {
        WorkoutPlan plan = workoutPlanRepository.findById(planId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Workout plan not found"));
        return WorkoutPlanResponse.fromEntity(plan);
    }

    @Transactional
    public WorkoutPlanResponse activateWorkoutPlan(UUID trainerId, UUID planId) {
        WorkoutPlan plan = workoutPlanRepository.findById(planId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Workout plan not found"));
        if (!plan.getTrainer().getId().equals(trainerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the trainer can activate plans");
        }
        if (plan.getStatus() != WorkoutPlan.PlanStatus.DRAFT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only draft plans can be activated");
        }

        // Auto-archive overlapping active workout plans for the same connection
        List<WorkoutPlan> activePlans = workoutPlanRepository
                .findByConnectionIdAndStatus(plan.getConnection().getId(), WorkoutPlan.PlanStatus.ACTIVE);
        for (WorkoutPlan existing : activePlans) {
            boolean overlaps = !plan.getEndDate().isBefore(existing.getStartDate())
                    && !plan.getStartDate().isAfter(existing.getEndDate());
            if (overlaps) {
                existing.setStatus(WorkoutPlan.PlanStatus.ARCHIVED);
                workoutPlanRepository.save(existing);
            }
        }

        plan.setStatus(WorkoutPlan.PlanStatus.ACTIVE);
        return WorkoutPlanResponse.fromEntity(workoutPlanRepository.save(plan));
    }

    @Transactional
    public WorkoutPlanResponse cancelWorkoutPlan(UUID trainerId, UUID planId) {
        WorkoutPlan plan = workoutPlanRepository.findById(planId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Workout plan not found"));
        if (!plan.getTrainer().getId().equals(trainerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the trainer can cancel plans");
        }
        if (plan.getStatus() == WorkoutPlan.PlanStatus.ARCHIVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Plan is already cancelled");
        }
        plan.setStatus(WorkoutPlan.PlanStatus.ARCHIVED);
        return WorkoutPlanResponse.fromEntity(workoutPlanRepository.save(plan));
    }

    // ==================== DIET PLANS ====================

    @Transactional
    public DietPlanResponse createDietPlan(UUID trainerId, CreateDietPlanRequest req) {
        Connection connection = connectionRepository.findById(req.getConnectionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Connection not found"));

        if (!connection.getTrainer().getId().equals(trainerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the trainer can create plans");
        }
        if (connection.getStatus() != Connection.ConnectionStatus.ACCEPTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Connection must be accepted");
        }

        Profile trainer = connection.getTrainer();
        Profile client = connection.getClient();

        DietPlan plan = DietPlan.builder()
                .connection(connection)
                .trainer(trainer)
                .client(client)
                .title(req.getTitle())
                .description(req.getDescription())
                .dailyCalorieTarget(req.getDailyCalorieTarget())
                .proteinGrams(req.getProteinGrams())
                .carbsGrams(req.getCarbsGrams())
                .fatGrams(req.getFatGrams())
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .notes(req.getNotes())
                .status(DietPlan.DietPlanStatus.DRAFT)
                .build();

        if (req.getMeals() != null) {
            AtomicInteger mealOrder = new AtomicInteger(0);
            for (CreateDietPlanRequest.MealInput mealInput : req.getMeals()) {
                DietPlanMeal meal = DietPlanMeal.builder()
                        .dietPlan(plan)
                        .mealName(mealInput.getMealName())
                        .mealTime(mealInput.getMealTime() != null ? LocalTime.parse(mealInput.getMealTime()) : null)
                        .sortOrder(mealOrder.getAndIncrement())
                        .build();

                if (mealInput.getItems() != null) {
                    AtomicInteger itemOrder = new AtomicInteger(0);
                    List<DietMealItem> items = mealInput.getItems().stream().map(itemInput -> {
                        return DietMealItem.builder()
                                .dietMeal(meal)
                                .foodName(itemInput.getFoodName())
                                .quantity(itemInput.getQuantity())
                                .calories(itemInput.getCalories())
                                .proteinGrams(itemInput.getProteinGrams())
                                .carbsGrams(itemInput.getCarbsGrams())
                                .fatGrams(itemInput.getFatGrams())
                                .alternatives(itemInput.getAlternatives())
                                .sortOrder(itemOrder.getAndIncrement())
                                .build();
                    }).collect(Collectors.toList());
                    meal.setItems(items);
                }
                plan.getMeals().add(meal);
            }
        }

        DietPlan saved = dietPlanRepository.save(plan);
        return DietPlanResponse.fromEntity(saved);
    }

    public List<DietPlanResponse> getDietPlansByTrainer(UUID trainerId) {
        return dietPlanRepository.findByTrainerIdOrderByCreatedAtDesc(trainerId).stream()
                .map(DietPlanResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<DietPlanResponse> getDietPlansByClient(UUID clientId) {
        return dietPlanRepository.findByClientIdOrderByCreatedAtDesc(clientId).stream()
                .filter(p -> p.getStatus() != DietPlan.DietPlanStatus.DRAFT)
                .map(DietPlanResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<DietPlanResponse> getDietPlansByConnection(UUID connectionId) {
        return dietPlanRepository.findByConnectionIdOrderByCreatedAtDesc(connectionId).stream()
                .map(DietPlanResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public DietPlanResponse getDietPlan(UUID planId) {
        DietPlan plan = dietPlanRepository.findById(planId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Diet plan not found"));
        return DietPlanResponse.fromEntity(plan);
    }

    @Transactional
    public DietPlanResponse activateDietPlan(UUID trainerId, UUID planId) {
        DietPlan plan = dietPlanRepository.findById(planId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Diet plan not found"));
        if (!plan.getTrainer().getId().equals(trainerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the trainer can activate plans");
        }
        if (plan.getStatus() != DietPlan.DietPlanStatus.DRAFT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only draft plans can be activated");
        }

        // Auto-archive overlapping active diet plans for the same connection
        List<DietPlan> activePlans = dietPlanRepository
                .findByConnectionIdAndStatus(plan.getConnection().getId(), DietPlan.DietPlanStatus.ACTIVE);
        for (DietPlan existing : activePlans) {
            boolean overlaps = !plan.getEndDate().isBefore(existing.getStartDate())
                    && !plan.getStartDate().isAfter(existing.getEndDate());
            if (overlaps) {
                existing.setStatus(DietPlan.DietPlanStatus.ARCHIVED);
                dietPlanRepository.save(existing);
            }
        }

        plan.setStatus(DietPlan.DietPlanStatus.ACTIVE);
        return DietPlanResponse.fromEntity(dietPlanRepository.save(plan));
    }

    @Transactional
    public DietPlanResponse cancelDietPlan(UUID trainerId, UUID planId) {
        DietPlan plan = dietPlanRepository.findById(planId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Diet plan not found"));
        if (!plan.getTrainer().getId().equals(trainerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the trainer can cancel plans");
        }
        if (plan.getStatus() == DietPlan.DietPlanStatus.ARCHIVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Plan is already cancelled");
        }
        plan.setStatus(DietPlan.DietPlanStatus.ARCHIVED);
        return DietPlanResponse.fromEntity(dietPlanRepository.save(plan));
    }

    // ==================== EXERCISE LOGS ====================

    @Transactional
    public ExerciseLogResponse createExerciseLog(UUID userId, CreateExerciseLogRequest req) {
        Connection connection = connectionRepository.findById(req.getConnectionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Connection not found"));

        Profile loggedBy = profileRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));

        PlanExercise planExercise = null;
        // planExercise lookup is optional

        ExerciseLog log = ExerciseLog.builder()
                .connection(connection)
                .loggedBy(loggedBy)
                .planExercise(planExercise)
                .exerciseName(req.getExerciseName())
                .logDate(req.getLogDate())
                .setsCompleted(req.getSetsCompleted())
                .repsCompleted(req.getRepsCompleted())
                .weightUsed(req.getWeightUsed())
                .weightUnit(req.getWeightUnit())
                .durationSeconds(req.getDurationSeconds())
                .isPr(req.getIsPr() != null ? req.getIsPr() : false)
                .notes(req.getNotes())
                .build();

        ExerciseLog saved = exerciseLogRepository.save(log);
        return ExerciseLogResponse.fromEntity(saved);
    }

    public List<ExerciseLogResponse> getExerciseLogsByConnection(UUID connectionId) {
        return exerciseLogRepository.findByConnectionIdOrderByLogDateDescCreatedAtDesc(connectionId).stream()
                .map(ExerciseLogResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ExerciseLogResponse> getExerciseLogsByConnectionAndDate(UUID connectionId, java.time.LocalDate date) {
        return exerciseLogRepository.findByConnectionIdAndLogDateOrderByCreatedAtDesc(connectionId, date).stream()
                .map(ExerciseLogResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // ==================== MEAL LOGS ====================

    @Transactional
    public MealLogResponse createMealLog(UUID clientId, CreateMealLogRequest req) {
        Connection connection = connectionRepository.findById(req.getConnectionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Connection not found"));

        if (!connection.getClient().getId().equals(clientId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the client can log meals");
        }

        Profile client = connection.getClient();

        MealLog log = MealLog.builder()
                .connection(connection)
                .client(client)
                .logDate(req.getLogDate())
                .mealName(req.getMealName())
                .compliance(MealLog.MealCompliance.valueOf(req.getCompliance()))
                .photoUrl(req.getPhotoUrl())
                .itemsConsumed(req.getItemsConsumed())
                .estimatedCalories(req.getEstimatedCalories())
                .proteinGrams(req.getProteinGrams())
                .carbsGrams(req.getCarbsGrams())
                .fatGrams(req.getFatGrams())
                .notes(req.getNotes())
                .trainerVerified(false)
                .build();

        MealLog saved = mealLogRepository.save(log);
        return MealLogResponse.fromEntity(saved);
    }

    public List<MealLogResponse> getMealLogsByConnection(UUID connectionId) {
        return mealLogRepository.findByConnectionIdOrderByLogDateDescCreatedAtDesc(connectionId).stream()
                .map(MealLogResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<MealLogResponse> getMealLogsByConnectionAndDate(UUID connectionId, java.time.LocalDate date) {
        return mealLogRepository.findByConnectionIdAndLogDateOrderByCreatedAtDesc(connectionId, date).stream()
                .map(MealLogResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<MealLogResponse> getMealLogsByClient(UUID clientId) {
        return mealLogRepository.findByClientIdOrderByLogDateDescCreatedAtDesc(clientId).stream()
                .map(MealLogResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public MealLogResponse verifyMealLog(UUID trainerId, UUID logId) {
        MealLog log = mealLogRepository.findById(logId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Meal log not found"));

        if (!log.getConnection().getTrainer().getId().equals(trainerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the trainer can verify meal logs");
        }

        log.setTrainerVerified(true);
        log.setTrainerVerifiedAt(java.time.LocalDateTime.now());
        MealLog saved = mealLogRepository.save(log);
        return MealLogResponse.fromEntity(saved);
    }
}
