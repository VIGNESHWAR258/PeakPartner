package com.peakpartner.connection.dto;

import com.peakpartner.connection.model.Connection;
import com.peakpartner.profile.dto.ProfileResponse;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ConnectionResponse {
    private UUID id;
    private ProfileResponse client;
    private ProfileResponse trainer;
    private Connection.ConnectionStatus status;
    private Connection.ProgramType program;
    private String notes;
    private LocalDateTime connectedAt;
    private LocalDateTime createdAt;

    public static ConnectionResponse fromEntity(Connection connection) {
        return ConnectionResponse.builder()
                .id(connection.getId())
                .client(ProfileResponse.fromEntity(connection.getClient()))
                .trainer(ProfileResponse.fromEntity(connection.getTrainer()))
                .status(connection.getStatus())
                .program(connection.getProgram())
                .notes(connection.getNotes())
                .connectedAt(connection.getConnectedAt())
                .createdAt(connection.getCreatedAt())
                .build();
    }
}
