package com.peakpartner.session.service;

import com.peakpartner.common.exception.*;
import com.peakpartner.connection.model.Connection;
import com.peakpartner.connection.repository.ConnectionRepository;
import com.peakpartner.profile.model.Profile;
import com.peakpartner.profile.repository.ProfileRepository;
import com.peakpartner.session.dto.*;
import com.peakpartner.session.model.RescheduleRequest;
import com.peakpartner.session.model.RescheduleRequest.RescheduleStatus;
import com.peakpartner.session.model.SessionBooking;
import com.peakpartner.session.model.SessionBooking.BookingStatus;
import com.peakpartner.session.model.SessionBooking.SessionType;
import com.peakpartner.session.repository.RescheduleRequestRepository;
import com.peakpartner.session.repository.SessionBookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionBookingRepository sessionBookingRepository;
    private final RescheduleRequestRepository rescheduleRequestRepository;
    private final ConnectionRepository connectionRepository;
    private final ProfileRepository profileRepository;

    @Transactional
    public SessionResponse createSession(UUID userId, CreateSessionRequest request) {
        Connection connection = connectionRepository.findById(request.getConnectionId())
                .orElseThrow(() -> new ResourceNotFoundException("Connection not found"));

        if (connection.getStatus() != Connection.ConnectionStatus.ACCEPTED) {
            throw new BadRequestException("Connection must be accepted to book sessions");
        }

        boolean isTrainer = connection.getTrainer().getId().equals(userId);
        boolean isClient = connection.getClient().getId().equals(userId);
        if (!isTrainer && !isClient) {
            throw new UnauthorizedException("You are not part of this connection");
        }

        SessionType sessionType = SessionType.IN_PERSON;
        if (request.getSessionType() != null) {
            sessionType = SessionType.valueOf(request.getSessionType());
        }

        // Check for overlapping sessions for the trainer
        List<SessionBooking> trainerOverlaps = sessionBookingRepository.findOverlappingSessionsForTrainer(
                connection.getTrainer().getId(), request.getSessionDate(),
                request.getStartTime(), request.getEndTime(), BookingStatus.BOOKED);
        if (!trainerOverlaps.isEmpty()) {
            throw new BadRequestException("Trainer already has a session booked during this time slot");
        }

        // Check for overlapping sessions for the client
        List<SessionBooking> clientOverlaps = sessionBookingRepository.findOverlappingSessionsForClient(
                connection.getClient().getId(), request.getSessionDate(),
                request.getStartTime(), request.getEndTime(), BookingStatus.BOOKED);
        if (!clientOverlaps.isEmpty()) {
            throw new BadRequestException("Client already has a session booked during this time slot");
        }

        SessionBooking booking = SessionBooking.builder()
                .connection(connection)
                .client(connection.getClient())
                .trainer(connection.getTrainer())
                .sessionDate(request.getSessionDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .sessionType(sessionType)
                .status(BookingStatus.BOOKED)
                .notes(request.getNotes())
                .build();

        try {
            booking = sessionBookingRepository.save(booking);
        } catch (DataIntegrityViolationException e) {
            // DB exclusion constraint caught a concurrent overlapping booking
            throw new BadRequestException("This time slot was just booked by someone else. Please choose a different time.");
        }
        return SessionResponse.fromEntity(booking);
    }

    @Transactional
    public SessionResponse cancelSession(UUID userId, UUID sessionId, String reason) {
        SessionBooking booking = sessionBookingRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        if (!booking.getClient().getId().equals(userId) && !booking.getTrainer().getId().equals(userId)) {
            throw new UnauthorizedException("You can only cancel your own sessions");
        }
        if (booking.getStatus() != BookingStatus.BOOKED) {
            throw new BadRequestException("Can only cancel booked sessions");
        }

        Profile cancelledBy = profileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelReason(reason);
        booking.setCancelledBy(cancelledBy);
        booking = sessionBookingRepository.save(booking);
        return SessionResponse.fromEntity(booking);
    }

    // ==================== RESCHEDULE ====================

    @Transactional
    public RescheduleResponse createRescheduleRequest(UUID userId, CreateRescheduleRequest request) {
        SessionBooking booking = sessionBookingRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        if (!booking.getClient().getId().equals(userId) && !booking.getTrainer().getId().equals(userId)) {
            throw new UnauthorizedException("You are not part of this session");
        }
        if (booking.getStatus() != BookingStatus.BOOKED) {
            throw new BadRequestException("Can only reschedule booked sessions");
        }

        // Check no pending reschedule already exists
        List<RescheduleRequest> pending = rescheduleRequestRepository
                .findBySessionIdAndStatus(request.getSessionId(), RescheduleStatus.PENDING);
        if (!pending.isEmpty()) {
            throw new BadRequestException("A reschedule request is already pending for this session");
        }

        Profile requester = profileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        RescheduleRequest rr = RescheduleRequest.builder()
                .session(booking)
                .requestedBy(requester)
                .proposedDate(request.getProposedDate())
                .proposedStartTime(request.getProposedStartTime())
                .proposedEndTime(request.getProposedEndTime())
                .reason(request.getReason())
                .status(RescheduleStatus.PENDING)
                .build();

        rr = rescheduleRequestRepository.save(rr);
        return RescheduleResponse.fromEntity(rr);
    }

    @Transactional
    public RescheduleResponse respondToReschedule(UUID userId, UUID rescheduleId, boolean accept) {
        RescheduleRequest rr = rescheduleRequestRepository.findById(rescheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Reschedule request not found"));

        SessionBooking booking = rr.getSession();
        // Only the other party can respond (not the requester)
        boolean isTrainer = booking.getTrainer().getId().equals(userId);
        boolean isClient = booking.getClient().getId().equals(userId);
        if (!isTrainer && !isClient) {
            throw new UnauthorizedException("You are not part of this session");
        }
        if (rr.getRequestedBy().getId().equals(userId)) {
            throw new BadRequestException("You cannot respond to your own reschedule request");
        }
        if (rr.getStatus() != RescheduleStatus.PENDING) {
            throw new BadRequestException("This reschedule request has already been responded to");
        }

        if (accept) {
            // Check for overlaps at the new time
            List<SessionBooking> trainerOverlaps = sessionBookingRepository.findOverlappingSessionsForTrainer(
                    booking.getTrainer().getId(), rr.getProposedDate(),
                    rr.getProposedStartTime(), rr.getProposedEndTime(), BookingStatus.BOOKED);
            // Exclude the current session from overlap check
            trainerOverlaps.removeIf(s -> s.getId().equals(booking.getId()));
            if (!trainerOverlaps.isEmpty()) {
                throw new BadRequestException("Trainer has a conflicting session at the proposed time");
            }
            List<SessionBooking> clientOverlaps = sessionBookingRepository.findOverlappingSessionsForClient(
                    booking.getClient().getId(), rr.getProposedDate(),
                    rr.getProposedStartTime(), rr.getProposedEndTime(), BookingStatus.BOOKED);
            clientOverlaps.removeIf(s -> s.getId().equals(booking.getId()));
            if (!clientOverlaps.isEmpty()) {
                throw new BadRequestException("Client has a conflicting session at the proposed time");
            }

            // Update the session
            booking.setSessionDate(rr.getProposedDate());
            booking.setStartTime(rr.getProposedStartTime());
            booking.setEndTime(rr.getProposedEndTime());
            try {
                sessionBookingRepository.save(booking);
            } catch (DataIntegrityViolationException e) {
                throw new BadRequestException("The proposed time slot conflicts with another booking that was just created. Please try a different time.");
            }

            rr.setStatus(RescheduleStatus.ACCEPTED);
        } else {
            rr.setStatus(RescheduleStatus.DECLINED);
        }
        rr.setRespondedAt(java.time.LocalDateTime.now());
        rr = rescheduleRequestRepository.save(rr);
        return RescheduleResponse.fromEntity(rr);
    }

    public List<RescheduleResponse> getRescheduleRequestsForSession(UUID sessionId) {
        return rescheduleRequestRepository.findBySessionIdOrderByCreatedAtDesc(sessionId).stream()
                .map(RescheduleResponse::fromEntity).collect(Collectors.toList());
    }

    public List<RescheduleResponse> getPendingRescheduleRequestsForUser(UUID userId) {
        return rescheduleRequestRepository.findPendingForUser(userId, RescheduleStatus.PENDING).stream()
                .map(RescheduleResponse::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public SessionResponse completeSession(UUID trainerId, UUID sessionId) {
        SessionBooking booking = sessionBookingRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        if (!booking.getTrainer().getId().equals(trainerId)) {
            throw new UnauthorizedException("Only the trainer can mark sessions as completed");
        }

        booking.setStatus(BookingStatus.COMPLETED);
        booking = sessionBookingRepository.save(booking);
        return SessionResponse.fromEntity(booking);
    }

    public List<SessionResponse> getSessionsForTrainer(UUID trainerId) {
        return sessionBookingRepository.findByTrainerIdOrderBySessionDateDescStartTimeDesc(trainerId)
                .stream().map(SessionResponse::fromEntity).collect(Collectors.toList());
    }

    public List<SessionResponse> getSessionsForClient(UUID clientId) {
        return sessionBookingRepository.findByClientIdOrderBySessionDateDescStartTimeDesc(clientId)
                .stream().map(SessionResponse::fromEntity).collect(Collectors.toList());
    }

    public List<SessionResponse> getTodaysSessionsForTrainer(UUID trainerId) {
        return sessionBookingRepository.findByTrainerIdAndSessionDate(trainerId, LocalDate.now())
                .stream().map(SessionResponse::fromEntity).collect(Collectors.toList());
    }

    public List<SessionResponse> getTodaysSessionsForClient(UUID clientId) {
        return sessionBookingRepository.findByClientIdAndSessionDate(clientId, LocalDate.now())
                .stream().map(SessionResponse::fromEntity).collect(Collectors.toList());
    }

    public SessionResponse getUpcomingSessionForClient(UUID clientId) {
        List<SessionBooking> upcoming = sessionBookingRepository
                .findByClientIdAndSessionDateGreaterThanEqualAndStatusOrderBySessionDateAscStartTimeAsc(
                        clientId, LocalDate.now(), BookingStatus.BOOKED);
        if (upcoming.isEmpty()) return null;
        return SessionResponse.fromEntity(upcoming.get(0));
    }

    public SessionResponse getUpcomingSessionForTrainer(UUID trainerId) {
        List<SessionBooking> upcoming = sessionBookingRepository
                .findByTrainerIdAndSessionDateGreaterThanEqualAndStatusOrderBySessionDateAscStartTimeAsc(
                        trainerId, LocalDate.now(), BookingStatus.BOOKED);
        if (upcoming.isEmpty()) return null;
        return SessionResponse.fromEntity(upcoming.get(0));
    }

    public List<SessionResponse> getUpcomingSessionsForTrainer(UUID trainerId) {
        return sessionBookingRepository
                .findByTrainerIdAndSessionDateGreaterThanEqualAndStatusOrderBySessionDateAscStartTimeAsc(
                        trainerId, LocalDate.now(), BookingStatus.BOOKED)
                .stream().map(SessionResponse::fromEntity).collect(Collectors.toList());
    }

    public List<SessionResponse> getUpcomingSessionsForClient(UUID clientId) {
        return sessionBookingRepository
                .findByClientIdAndSessionDateGreaterThanEqualAndStatusOrderBySessionDateAscStartTimeAsc(
                        clientId, LocalDate.now(), BookingStatus.BOOKED)
                .stream().map(SessionResponse::fromEntity).collect(Collectors.toList());
    }
}
