package com.peakpartner.session.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
public class CreateRescheduleRequest {
    @NotNull
    private UUID sessionId;
    @NotNull
    private LocalDate proposedDate;
    @NotNull
    private LocalTime proposedStartTime;
    @NotNull
    private LocalTime proposedEndTime;
    private String reason;
}
