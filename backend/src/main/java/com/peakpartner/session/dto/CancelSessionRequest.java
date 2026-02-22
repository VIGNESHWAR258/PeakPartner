package com.peakpartner.session.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
public class CancelSessionRequest {
    private String reason;
}
