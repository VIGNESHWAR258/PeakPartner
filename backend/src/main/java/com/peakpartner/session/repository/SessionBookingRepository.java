package com.peakpartner.session.repository;

import com.peakpartner.session.model.SessionBooking;
import com.peakpartner.session.model.SessionBooking.BookingStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface SessionBookingRepository extends JpaRepository<SessionBooking, UUID> {
    List<SessionBooking> findByTrainerIdOrderBySessionDateDescStartTimeDesc(UUID trainerId);
    List<SessionBooking> findByClientIdOrderBySessionDateDescStartTimeDesc(UUID clientId);
    List<SessionBooking> findByConnectionIdOrderBySessionDateDesc(UUID connectionId);
    List<SessionBooking> findByTrainerIdAndSessionDate(UUID trainerId, LocalDate date);
    List<SessionBooking> findByClientIdAndSessionDate(UUID clientId, LocalDate date);
    List<SessionBooking> findByClientIdAndSessionDateGreaterThanEqualAndStatusOrderBySessionDateAscStartTimeAsc(
            UUID clientId, LocalDate date, BookingStatus status);
    List<SessionBooking> findByTrainerIdAndSessionDateGreaterThanEqualAndStatusOrderBySessionDateAscStartTimeAsc(
            UUID trainerId, LocalDate date, BookingStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM SessionBooking s WHERE s.trainer.id = :trainerId AND s.sessionDate = :sessionDate " +
           "AND s.status = :status AND s.startTime < :endTime AND s.endTime > :startTime")
    List<SessionBooking> findOverlappingSessionsForTrainer(
            @Param("trainerId") UUID trainerId,
            @Param("sessionDate") LocalDate sessionDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("status") BookingStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM SessionBooking s WHERE s.client.id = :clientId AND s.sessionDate = :sessionDate " +
           "AND s.status = :status AND s.startTime < :endTime AND s.endTime > :startTime")
    List<SessionBooking> findOverlappingSessionsForClient(
            @Param("clientId") UUID clientId,
            @Param("sessionDate") LocalDate sessionDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("status") BookingStatus status);
}
