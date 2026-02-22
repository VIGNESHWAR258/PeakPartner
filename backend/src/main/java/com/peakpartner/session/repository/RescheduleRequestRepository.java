package com.peakpartner.session.repository;

import com.peakpartner.session.model.RescheduleRequest;
import com.peakpartner.session.model.RescheduleRequest.RescheduleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RescheduleRequestRepository extends JpaRepository<RescheduleRequest, UUID> {
    List<RescheduleRequest> findBySessionIdOrderByCreatedAtDesc(UUID sessionId);
    List<RescheduleRequest> findBySessionIdAndStatus(UUID sessionId, RescheduleStatus status);
    List<RescheduleRequest> findByRequestedByIdOrderByCreatedAtDesc(UUID userId);

    // Find pending reschedule requests where the user needs to respond (they are part of the session but NOT the requester)
    @Query("SELECT rr FROM RescheduleRequest rr WHERE rr.status = :status AND " +
           "(rr.session.client.id = :userId OR rr.session.trainer.id = :userId) AND " +
           "rr.requestedBy.id <> :userId ORDER BY rr.createdAt DESC")
    List<RescheduleRequest> findPendingForUser(@Param("userId") UUID userId, @Param("status") RescheduleStatus status);
}
