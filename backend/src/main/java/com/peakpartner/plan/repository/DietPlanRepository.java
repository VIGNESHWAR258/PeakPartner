package com.peakpartner.plan.repository;

import com.peakpartner.plan.model.DietPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DietPlanRepository extends JpaRepository<DietPlan, UUID> {

    List<DietPlan> findByTrainerIdOrderByCreatedAtDesc(UUID trainerId);

    List<DietPlan> findByClientIdOrderByCreatedAtDesc(UUID clientId);

    List<DietPlan> findByConnectionIdOrderByCreatedAtDesc(UUID connectionId);

    List<DietPlan> findByClientIdAndStatus(UUID clientId, DietPlan.DietPlanStatus status);

    List<DietPlan> findByConnectionIdAndStatus(UUID connectionId, DietPlan.DietPlanStatus status);
}
