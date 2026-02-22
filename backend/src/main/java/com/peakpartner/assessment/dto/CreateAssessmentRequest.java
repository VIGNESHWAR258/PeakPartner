package com.peakpartner.assessment.dto;

import lombok.Data;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

@Data
public class CreateAssessmentRequest {
    @NotNull
    private UUID connectionId;

    @NotNull
    private String title;

    @NotNull
    private String questions; // JSON array string
}
