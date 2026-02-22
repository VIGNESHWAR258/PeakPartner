package com.peakpartner.session.controller;

import com.peakpartner.common.dto.ApiResponse;
import com.peakpartner.profile.model.Profile;
import com.peakpartner.session.dto.*;
import com.peakpartner.session.service.SessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    @PostMapping
    public ResponseEntity<ApiResponse<SessionResponse>> createSession(
            @AuthenticationPrincipal Profile currentUser,
            @Valid @RequestBody CreateSessionRequest request) {
        SessionResponse response = sessionService.createSession(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Session booked", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SessionResponse>>> getMySessions(
            @AuthenticationPrincipal Profile currentUser) {
        List<SessionResponse> sessions;
        if (currentUser.getRole() == Profile.Role.TRAINER) {
            sessions = sessionService.getSessionsForTrainer(currentUser.getId());
        } else {
            sessions = sessionService.getSessionsForClient(currentUser.getId());
        }
        return ResponseEntity.ok(ApiResponse.success("Sessions retrieved", sessions));
    }

    @GetMapping("/today")
    public ResponseEntity<ApiResponse<List<SessionResponse>>> getTodaysSessions(
            @AuthenticationPrincipal Profile currentUser) {
        List<SessionResponse> sessions;
        if (currentUser.getRole() == Profile.Role.TRAINER) {
            sessions = sessionService.getTodaysSessionsForTrainer(currentUser.getId());
        } else {
            sessions = sessionService.getTodaysSessionsForClient(currentUser.getId());
        }
        return ResponseEntity.ok(ApiResponse.success("Today's sessions", sessions));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<ApiResponse<SessionResponse>> getUpcomingSession(
            @AuthenticationPrincipal Profile currentUser) {
        SessionResponse session;
        if (currentUser.getRole() == Profile.Role.TRAINER) {
            session = sessionService.getUpcomingSessionForTrainer(currentUser.getId());
        } else {
            session = sessionService.getUpcomingSessionForClient(currentUser.getId());
        }
        return ResponseEntity.ok(ApiResponse.success("Upcoming session", session));
    }

    @GetMapping("/upcoming-list")
    public ResponseEntity<ApiResponse<List<SessionResponse>>> getUpcomingSessions(
            @AuthenticationPrincipal Profile currentUser) {
        List<SessionResponse> sessions;
        if (currentUser.getRole() == Profile.Role.TRAINER) {
            sessions = sessionService.getUpcomingSessionsForTrainer(currentUser.getId());
        } else {
            sessions = sessionService.getUpcomingSessionsForClient(currentUser.getId());
        }
        return ResponseEntity.ok(ApiResponse.success("Upcoming sessions", sessions));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<SessionResponse>> cancelSession(
            @AuthenticationPrincipal Profile currentUser,
            @PathVariable UUID id,
            @RequestBody(required = false) CancelSessionRequest request) {
        String reason = request != null ? request.getReason() : null;
        SessionResponse response = sessionService.cancelSession(currentUser.getId(), id, reason);
        return ResponseEntity.ok(ApiResponse.success("Session cancelled", response));
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<SessionResponse>> completeSession(
            @AuthenticationPrincipal Profile currentUser,
            @PathVariable UUID id) {
        SessionResponse response = sessionService.completeSession(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Session completed", response));
    }

    // ==================== RESCHEDULE ====================

    @PostMapping("/reschedule")
    public ResponseEntity<ApiResponse<RescheduleResponse>> createRescheduleRequest(
            @AuthenticationPrincipal Profile currentUser,
            @Valid @RequestBody CreateRescheduleRequest request) {
        RescheduleResponse response = sessionService.createRescheduleRequest(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Reschedule request created", response));
    }

    @PutMapping("/reschedule/{id}/accept")
    public ResponseEntity<ApiResponse<RescheduleResponse>> acceptReschedule(
            @AuthenticationPrincipal Profile currentUser,
            @PathVariable UUID id) {
        RescheduleResponse response = sessionService.respondToReschedule(currentUser.getId(), id, true);
        return ResponseEntity.ok(ApiResponse.success("Reschedule accepted", response));
    }

    @PutMapping("/reschedule/{id}/decline")
    public ResponseEntity<ApiResponse<RescheduleResponse>> declineReschedule(
            @AuthenticationPrincipal Profile currentUser,
            @PathVariable UUID id) {
        RescheduleResponse response = sessionService.respondToReschedule(currentUser.getId(), id, false);
        return ResponseEntity.ok(ApiResponse.success("Reschedule declined", response));
    }

    @GetMapping("/{id}/reschedule-requests")
    public ResponseEntity<ApiResponse<List<RescheduleResponse>>> getRescheduleRequests(
            @PathVariable UUID id) {
        List<RescheduleResponse> requests = sessionService.getRescheduleRequestsForSession(id);
        return ResponseEntity.ok(ApiResponse.success("Reschedule requests retrieved", requests));
    }

    @GetMapping("/reschedule/pending")
    public ResponseEntity<ApiResponse<List<RescheduleResponse>>> getPendingRescheduleRequests(
            @AuthenticationPrincipal Profile currentUser) {
        List<RescheduleResponse> requests = sessionService.getPendingRescheduleRequestsForUser(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Pending reschedule requests", requests));
    }
}
