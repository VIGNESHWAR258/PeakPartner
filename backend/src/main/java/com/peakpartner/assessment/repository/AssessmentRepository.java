package com.peakpartner.assessment.repository;

import com.peakpartner.assessment.model.Assessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AssessmentRepository extends JpaRepository<Assessment, UUID> {

    List<Assessment> findByTrainerIdOrderByCreatedAtDesc(UUID trainerId);

    List<Assessment> findByClientIdOrderByCreatedAtDesc(UUID clientId);

    List<Assessment> findByConnectionIdOrderByCreatedAtDesc(UUID connectionId);

    List<Assessment> findByClientIdAndStatus(UUID clientId, String status);
}
