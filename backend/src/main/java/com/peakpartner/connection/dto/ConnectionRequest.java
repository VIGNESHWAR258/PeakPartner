package com.peakpartner.connection.dto;

import com.peakpartner.connection.model.Connection;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class ConnectionRequest {

    @NotNull(message = "Trainer ID is required")
    private UUID trainerId;

    @NotNull(message = "Program type is required")
    private Connection.ProgramType program;

    private String notes;
}
