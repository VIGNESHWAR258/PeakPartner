package com.peakpartner.session.dto;

import com.peakpartner.session.model.RescheduleRequest;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class RescheduleResponse {
    private UUID id;
    private UUID sessionId;
    private UUID requestedById;
    private String requestedByName;
    private LocalDate proposedDate;
    private String proposedStartTime;
    private String proposedEndTime;
    private String reason;
    private String status;
    private LocalDateTime respondedAt;
    private LocalDateTime createdAt;

    public static RescheduleResponse fromEntity(RescheduleRequest r) {
        return RescheduleResponse.builder()
                .id(r.getId())
                .sessionId(r.getSession().getId())
                .requestedById(r.getRequestedBy().getId())
                .requestedByName(r.getRequestedBy().getFullName())
                .proposedDate(r.getProposedDate())
                .proposedStartTime(r.getProposedStartTime().toString())
                .proposedEndTime(r.getProposedEndTime().toString())
                .reason(r.getReason())
                .status(r.getStatus().name())
                .respondedAt(r.getRespondedAt())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
