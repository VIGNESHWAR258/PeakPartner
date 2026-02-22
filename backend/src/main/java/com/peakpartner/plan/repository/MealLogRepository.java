package com.peakpartner.plan.repository;

import com.peakpartner.plan.model.MealLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface MealLogRepository extends JpaRepository<MealLog, UUID> {

    List<MealLog> findByConnectionIdAndLogDateOrderByCreatedAtDesc(UUID connectionId, LocalDate logDate);

    List<MealLog> findByConnectionIdOrderByLogDateDescCreatedAtDesc(UUID connectionId);

    List<MealLog> findByClientIdAndLogDate(UUID clientId, LocalDate logDate);

    List<MealLog> findByClientIdOrderByLogDateDescCreatedAtDesc(UUID clientId);
}
