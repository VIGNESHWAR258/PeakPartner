package com.peakpartner.session.repository;

import com.peakpartner.session.model.RescheduleRequest;
import com.peakpartner.session.model.RescheduleRequest.RescheduleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RescheduleRequestRepository extends JpaRepository<RescheduleRequest, UUID> {
    List<RescheduleRequest> findBySessionIdOrderByCreatedAtDesc(UUID sessionId);
    List<RescheduleRequest> findBySessionIdAndStatus(UUID sessionId, RescheduleStatus status);
    List<RescheduleRequest> findByRequestedByIdOrderByCreatedAtDesc(UUID userId);
}
