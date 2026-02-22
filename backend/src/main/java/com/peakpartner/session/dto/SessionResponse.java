package com.peakpartner.session.dto;

import com.peakpartner.session.model.SessionBooking;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class SessionResponse {
    private UUID id;
    private UUID connectionId;
    private UUID clientId;
    private String clientName;
    private UUID trainerId;
    private String trainerName;
    private LocalDate sessionDate;
    private String startTime;
    private String endTime;
    private String sessionType;
    private String status;
    private String notes;
    private String cancelReason;
    private String cancelledByName;
    private LocalDateTime createdAt;

    public static SessionResponse fromEntity(SessionBooking s) {
        return SessionResponse.builder()
                .id(s.getId())
                .connectionId(s.getConnection().getId())
                .clientId(s.getClient().getId())
                .clientName(s.getClient().getFullName())
                .trainerId(s.getTrainer().getId())
                .trainerName(s.getTrainer().getFullName())
                .sessionDate(s.getSessionDate())
                .startTime(s.getStartTime().toString())
                .endTime(s.getEndTime().toString())
                .sessionType(s.getSessionType().name())
                .status(s.getStatus().name())
                .notes(s.getNotes())
                .cancelReason(s.getCancelReason())
                .cancelledByName(s.getCancelledBy() != null ? s.getCancelledBy().getFullName() : null)
                .createdAt(s.getCreatedAt())
                .build();
    }
}
