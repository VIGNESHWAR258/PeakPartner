package com.peakpartner.session.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
public class CreateSessionRequest {
    @NotNull
    private UUID connectionId;
    @NotNull
    private LocalDate sessionDate;
    @NotNull
    private LocalTime startTime;
    @NotNull
    private LocalTime endTime;
    private String sessionType; // IN_PERSON or VIRTUAL
    private String notes;
}
