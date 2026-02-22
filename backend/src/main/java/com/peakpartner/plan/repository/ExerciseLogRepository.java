package com.peakpartner.plan.repository;

import com.peakpartner.plan.model.ExerciseLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface ExerciseLogRepository extends JpaRepository<ExerciseLog, UUID> {

    List<ExerciseLog> findByConnectionIdAndLogDateOrderByCreatedAtDesc(UUID connectionId, LocalDate logDate);

    List<ExerciseLog> findByConnectionIdOrderByLogDateDescCreatedAtDesc(UUID connectionId);

    List<ExerciseLog> findByLoggedByIdAndLogDate(UUID userId, LocalDate logDate);
}
