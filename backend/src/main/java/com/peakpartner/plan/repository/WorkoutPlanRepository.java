package com.peakpartner.plan.repository;

import com.peakpartner.plan.model.WorkoutPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkoutPlanRepository extends JpaRepository<WorkoutPlan, UUID> {

    List<WorkoutPlan> findByTrainerIdOrderByCreatedAtDesc(UUID trainerId);

    List<WorkoutPlan> findByClientIdOrderByCreatedAtDesc(UUID clientId);

    List<WorkoutPlan> findByConnectionIdOrderByCreatedAtDesc(UUID connectionId);

    List<WorkoutPlan> findByClientIdAndStatus(UUID clientId, WorkoutPlan.PlanStatus status);

    List<WorkoutPlan> findByConnectionIdAndStatus(UUID connectionId, WorkoutPlan.PlanStatus status);
}
